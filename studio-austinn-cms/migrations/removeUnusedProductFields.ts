/**
 * One-off cleanup: unset fields removed from the product schema (currency,
 * weightKg, size, subtitle) so Studio doesn't flag them as unknown fields.
 * Covers published documents and drafts.
 *
 * Usage (from studio-austinn-cms/):
 *   npx sanity exec migrations/removeUnusedProductFields.ts --with-user-token              # dry run
 *   npx sanity exec migrations/removeUnusedProductFields.ts --with-user-token -- --apply   # write
 */
import { getCliClient } from 'sanity/cli'

const APPLY = process.argv.includes('--apply')
const FIELDS = ['currency', 'weightKg', 'size', 'subtitle']
const BATCH = 50

const client = getCliClient({ apiVersion: '2024-01-01' })

async function run() {
  const { projectId, dataset } = client.config()
  console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} on ${projectId}/${dataset}\n`)

  const docs = await client.fetch<{ _id: string; title?: string; fields: string[] }[]>(
    `*[_type == "product" && (${FIELDS.map((f) => `defined(${f})`).join(' || ')})] {
      _id,
      "title": title.en,
      "fields": [${FIELDS.map((f) => `select(defined(${f}) => "${f}")`).join(', ')}]
    }`
  )

  for (const d of docs) {
    console.log(`  ${d.title ?? d._id}  —  ${d.fields.filter(Boolean).join(', ')}`)
  }
  console.log(`\n${docs.length} document(s) to clean.`)

  if (!APPLY) {
    console.log('Dry run only — nothing written. Re-run with `-- --apply` to write.\n')
    return
  }

  for (let i = 0; i < docs.length; i += BATCH) {
    const tx = client.transaction()
    docs.slice(i, i + BATCH).forEach((d) => tx.patch(d._id, (p) => p.unset(FIELDS)))
    await tx.commit({ visibility: 'async' })
    console.log(`  committed ${Math.min(i + BATCH, docs.length)}/${docs.length}`)
  }
  console.log('\nDone.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
