/**
 * One-off migration: merge every `artwork` document into the `product` type.
 *
 *   - An artwork whose title matches exactly one shop product (case-insensitive)
 *     is merged into it: the product gets showInCatalogue + catalogue fields.
 *   - Every other artwork becomes a new catalogue-only product
 *     (showInShop: false, showInCatalogue: true) with id `product-from-<artworkId>`.
 *   - Ambiguous matches (several artworks share a shop product's title) are not
 *     merged; those artworks become new catalogue-only products and are listed
 *     so they can be reconciled by hand.
 *
 * Usage (from studio-austinn-cms/):
 *   npx sanity exec migrations/artworksToProducts.ts --with-user-token                  # dry run
 *   npx sanity exec migrations/artworksToProducts.ts --with-user-token -- --apply       # write
 *   npx sanity exec migrations/artworksToProducts.ts --with-user-token -- --apply --delete-artworks
 *
 * Re-running is safe: new documents use createIfNotExists, merges are plain sets.
 */
import { getCliClient } from 'sanity/cli'

const APPLY = process.argv.includes('--apply')
const DELETE_ARTWORKS = process.argv.includes('--delete-artworks')
const BATCH = 50

const client = getCliClient({ apiVersion: '2024-01-01' })

interface Artwork {
  _id: string
  _createdAt: string
  title?: string
  type?: string
  description?: string
  coverImage?: Record<string, unknown>
}

interface Product {
  _id: string
  title?: string
  slug?: string
}

const norm = (s?: string) => (s ?? '').trim().toLowerCase()

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'artwork'

const randomKey = () => Math.random().toString(36).slice(2, 14)

async function run() {
  const { projectId, dataset } = client.config()
  console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} on ${projectId}/${dataset}\n`)

  const [artworks, products, artworkDrafts] = await Promise.all([
    client.fetch<Artwork[]>(
      `*[_type == "artwork" && !(_id in path("drafts.**"))] | order(_createdAt asc) {
        _id, _createdAt, title, type, description, coverImage
      }`
    ),
    client.fetch<Product[]>(
      `*[_type == "product" && !(_id in path("drafts.**"))] { _id, "title": title.en, "slug": slug.current }`
    ),
    client.fetch<string[]>(`*[_type == "artwork" && _id in path("drafts.**")]._id`),
  ])

  console.log(`Artworks: ${artworks.length}   Shop products: ${products.length}`)
  if (artworkDrafts.length) {
    console.log(`⚠ ${artworkDrafts.length} unpublished artwork draft(s) are NOT migrated: ${artworkDrafts.join(', ')}`)
  }

  // Title → shop product, and title → artworks with that title.
  const productByTitle = new Map(products.map((p) => [norm(p.title), p]))
  const artworksByTitle = new Map<string, Artwork[]>()
  for (const a of artworks) {
    const k = norm(a.title)
    artworksByTitle.set(k, [...(artworksByTitle.get(k) ?? []), a])
  }

  const usedSlugs = new Set(products.map((p) => p.slug).filter(Boolean) as string[])
  const uniqueSlug = (title: string) => {
    const base = slugify(title)
    let slug = base
    for (let i = 2; usedSlugs.has(slug); i++) slug = `${base}-${i}`
    usedSlugs.add(slug)
    return slug
  }

  const merges: { artwork: Artwork; product: Product }[] = []
  const creates: Artwork[] = []
  const ambiguous: { product: Product; artworks: Artwork[] }[] = []
  const skipped: { artwork: Artwork; reason: string }[] = []

  for (const a of artworks) {
    if (!a.title || !a.coverImage) {
      skipped.push({ artwork: a, reason: !a.title ? 'no title' : 'no cover image' })
      continue
    }
    const product = productByTitle.get(norm(a.title))
    const sameTitle = artworksByTitle.get(norm(a.title)) ?? []
    if (product && sameTitle.length === 1) {
      merges.push({ artwork: a, product })
    } else {
      if (product && !ambiguous.some((x) => x.product._id === product._id)) {
        ambiguous.push({ product, artworks: sameTitle })
      }
      creates.push(a)
    }
  }

  console.log(`\n── Merge into existing shop product (${merges.length}) ──`)
  for (const { artwork, product } of merges) {
    console.log(`  "${artwork.title}" (${artwork.type})  →  product ${product._id}`)
  }

  console.log(`\n── New catalogue-only products (${creates.length}) ──`)
  for (const a of creates) console.log(`  "${a.title}" (${a.type})`)

  if (ambiguous.length) {
    console.log(`\n── ⚠ Ambiguous: not merged, created as new catalogue pieces (${ambiguous.length}) ──`)
    for (const { product, artworks: list } of ambiguous) {
      console.log(`  Shop product "${product.title}" (${product._id}) matches ${list.length} artworks: ${list.map((a) => a._id).join(', ')}`)
    }
  }

  if (skipped.length) {
    console.log(`\n── ⚠ Skipped (${skipped.length}) — fix in Studio and re-run ──`)
    for (const { artwork, reason } of skipped) console.log(`  ${artwork._id} "${artwork.title ?? ''}": ${reason}`)
  }

  if (!APPLY) {
    console.log('\nDry run only — nothing written. Re-run with `-- --apply` to write.\n')
    return
  }

  // Build all mutations, then commit in batches.
  type Op = (tx: ReturnType<typeof client.transaction>) => void
  const ops: Op[] = []

  for (const { artwork, product } of merges) {
    ops.push((tx) =>
      tx.patch(product._id, (p) =>
        p.set({
          showInCatalogue: true,
          catalogueType: artwork.type,
          catalogueCaption: artwork.description ?? '',
          catalogueSortDate: artwork._createdAt,
        })
      )
    )
  }

  for (const a of creates) {
    ops.push((tx) =>
      tx.createIfNotExists({
        _id: `product-from-${a._id}`,
        _type: 'product',
        showInShop: false,
        showInCatalogue: true,
        catalogueType: a.type,
        catalogueCaption: a.description ?? '',
        catalogueSortDate: a._createdAt,
        title: { en: a.title },
        slug: { _type: 'slug', current: uniqueSlug(a.title!) },
        images: [{ ...a.coverImage, _key: randomKey() }],
      })
    )
  }

  if (DELETE_ARTWORKS) {
    // Only delete artworks that were actually migrated (not skipped ones).
    for (const a of [...merges.map((m) => m.artwork), ...creates]) {
      ops.push((tx) => tx.delete(a._id))
    }
  }

  for (let i = 0; i < ops.length; i += BATCH) {
    const tx = client.transaction()
    ops.slice(i, i + BATCH).forEach((op) => op(tx))
    await tx.commit({ visibility: 'async' })
    console.log(`  committed ${Math.min(i + BATCH, ops.length)}/${ops.length}`)
  }

  console.log(
    `\nDone: ${merges.length} merged, ${creates.length} created` +
      (DELETE_ARTWORKS ? `, ${merges.length + creates.length} artworks deleted` : ', artworks kept') +
      '.\n'
  )
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
