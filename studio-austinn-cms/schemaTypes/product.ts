import { defineField, defineType } from 'sanity'

// A document is in the shop unless "Show in Shop" is explicitly off, so products
// created before the toggle existed stay in the shop. Shop-only fields are hidden
// and their required rules skipped for catalogue-only pieces.
const inShop = (document: any) => document?.showInShop !== false
const hiddenOutsideShop = ({ document }: { document?: any }) => !inShop(document)
const requiredInShop = (Rule: any) =>
  Rule.custom((value: any, context: any) =>
    inShop(context.document) && (value === undefined || value === null || value === '')
      ? 'Required for shop items'
      : true
  )

// Real-world size of the painting in the "View on your wall" AR preview (cm).
// Paintings only; the AR button appears when both width and height are set.
const arDimensionField = (name: 'arWidthCm' | 'arHeightCm') =>
  defineField({
    name,
    title: name === 'arWidthCm' ? 'AR Width (cm)' : 'AR Height (cm)',
    type: 'number',
    description: 'Used for the "View on your wall" AR preview. Set both width and height to enable it.',
    hidden: ({ document }) => !inShop(document) || (document?.collection as string) !== 'paintings',
    validation: (Rule) => Rule.min(5).max(500),
  })

export default defineType({
  name: 'product',
  title: 'Artwork / Product',
  type: 'document',

  fields: [
    // ── Visibility ────────────────────────────────────────────────────────────

    defineField({
      name: 'showInShop',
      title: 'Show in Shop',
      type: 'boolean',
      initialValue: true,
      description: 'Sell this piece in the online shop. Turn off for catalogue-only pieces; the shop fields below are then hidden.',
    }),

    defineField({
      name: 'showInCatalogue',
      title: 'Show in Catalogue',
      type: 'boolean',
      initialValue: false,
      description: 'Show this piece in the artwork catalogue (Latest Pieces, Services galleries, Space Visualizer). Uses the first image as the cover.',
    }),

    defineField({
      name: 'catalogueType',
      title: 'Catalogue Type',
      type: 'string',
      hidden: ({ document }) => !document?.showInCatalogue,
      options: {
        list: [
          { title: 'Painting',     value: 'painting'     },
          { title: 'Sculpture',    value: 'sculpture'    },
          { title: 'Chandelier',   value: 'chandelier'   },
          { title: 'Installation', value: 'installation' },
          { title: 'Bespoke',      value: 'bespoke'      },
        ],
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.showInCatalogue && !value ? 'Required for catalogue pieces' : true
        ),
    }),

    defineField({
      name: 'catalogueCaption',
      title: 'Catalogue Caption',
      type: 'text',
      rows: 2,
      description: 'Short caption shown in the catalogue (40 characters max).',
      hidden: ({ document }) => !document?.showInCatalogue,
      validation: (Rule) => [
        Rule.custom((value, context) =>
          context.document?.showInCatalogue && !value ? 'Required for catalogue pieces' : true
        ),
        Rule.max(40).error('Caption must be 40 characters or less'),
      ],
    }),

    // Set by the artwork migration to the original artwork's _createdAt so the
    // catalogue keeps its order; new pieces fall back to their own _createdAt.
    defineField({
      name: 'catalogueSortDate',
      title: 'Catalogue Sort Date',
      type: 'datetime',
      hidden: true,
    }),

    // ── Identity ──────────────────────────────────────────────────────────────

    defineField({
      name: 'productType',
      title: 'Product Type',
      type: 'string',
      options: {
        list: [
          { title: 'Bundle (flat price)',           value: 'bundle'     },
          { title: 'Loose Link (chain builder)',    value: 'loose-link' },
        ],
        layout: 'radio',
      },
      initialValue: 'bundle',
      hidden: hiddenOutsideShop,
      validation: requiredInShop,
    }),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en', maxLength: 96 },
      hidden: hiddenOutsideShop,
      validation: (Rule) =>
        Rule.custom((value: any, context) =>
          inShop(context.document) && !value?.current ? 'Required for shop items' : true
        ),
    }),

    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Cover image(s) shown in the shop grid; the first one is also the catalogue cover. For loose-link products, also used as the product hero.',
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'variants',
      title: 'Color Variants',
      type: 'array',
      description:
        'Optional. Each variant has its own photo and stock status; price is the same as the product. The first variant is selected by default. Leave empty for a product without variants. Bundle products only.',
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
      of: [
        defineField({
          name: 'variant',
          title: 'Variant',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'object',
              description: 'e.g. Gold, Silver, Black',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'availability',
              title: 'Availability',
              type: 'string',
              options: {
                list: [
                  { title: 'In Stock',      value: 'in_stock'      },
                  { title: 'Sold',          value: 'sold'          },
                  { title: 'Made to Order', value: 'made_to_order' },
                ],
                layout: 'radio',
              },
              initialValue: 'in_stock',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'materials',
              title: 'Materials',
              type: 'object',
              description: 'Optional. Shown in the Dimensions & Materials tab when this variant is selected. Leave empty to use the product-level Materials.',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string' }),
              ],
            }),
          ],
          preview: {
            select: { title: 'name.en', availability: 'availability', media: 'image' },
            prepare({ title, availability, media }) {
              const availLabels: Record<string, string> = {
                in_stock: 'In Stock', sold: 'Sold', made_to_order: 'Made to Order',
              }
              return { title, subtitle: availLabels[availability] ?? availability, media }
            },
          },
        }),
      ],
    }),

    // ── Pricing ───────────────────────────────────────────────────────────────

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'VAT-INCLUSIVE price (5% UAE VAT included) - the customer sees exactly this amount. Use a round number (multiple of 10). Flat price for bundle products; not used for loose-link products. Optional when Size Options are set.',
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!inShop(context.document)) return true
          const type = (context.document?.productType as string) ?? 'bundle'
          const hasSizes = Array.isArray(context.document?.sizes) && (context.document?.sizes as unknown[]).length > 0
          if (type !== 'loose-link' && !hasSizes && (value === undefined || value === null)) {
            return 'Price is required for bundle products (or add Size Options with prices)'
          }
          if (value !== undefined && value !== null && (value as number) <= 0) {
            return 'Price must be a positive number'
          }
          if (value !== undefined && value !== null && (value as number) % 10 !== 0) {
            return { message: 'Tip: use a multiple of 10 (VAT-inclusive) so order totals stay round.', level: 'warning' as const }
          }
          return true
        }),
    }),

    defineField({
      name: 'sizes',
      title: 'Size Options',
      type: 'array',
      description:
        'Optional. Each size has its own price, e.g. "120cm x 140cm". The first size is selected by default. Shipping weight, shipping class and availability stay at product level. Bundle products only.',
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
      of: [
        defineField({
          name: 'sizeOption',
          title: 'Size',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Size (Width x Length)',
              type: 'string',
              description: 'Typed as you want it shown, e.g. 120cm x 140cm',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Price (incl. VAT)',
              type: 'number',
              description: 'VAT-inclusive; use a multiple of 10.',
              validation: (Rule) =>
                Rule.required()
                  .positive()
                  .custom((value) =>
                    value !== undefined && value !== null && (value as number) % 10 !== 0
                      ? { message: 'Tip: use a multiple of 10 (VAT-inclusive) so order totals stay round.', level: 'warning' as const }
                      : true
                  ),
            }),
            arDimensionField('arWidthCm'),
            arDimensionField('arHeightCm'),
          ],
          preview: {
            select: { title: 'label', price: 'price' },
            prepare({ title, price }) {
              return { title, subtitle: price != null ? String(price) : '' }
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'pricePerLink',
      title: 'Price Per Link',
      type: 'number',
      description: 'VAT-INCLUSIVE price per individual chain link (5% UAE VAT included) - use a multiple of 10. Used for loose-link products only.',
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) !== 'loose-link',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!inShop(context.document)) return true
          const type = (context.document?.productType as string) ?? 'bundle'
          if (type === 'loose-link' && (value === undefined || value === null)) {
            return 'Price per link is required for loose-link products'
          }
          if (value !== undefined && value !== null && (value as number) <= 0) {
            return 'Price per link must be a positive number'
          }
          if (value !== undefined && value !== null && (value as number) % 10 !== 0) {
            return { message: 'Tip: use a multiple of 10 (VAT-inclusive) so order totals stay round.', level: 'warning' as const }
          }
          return true
        }),
    }),

    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'AED',
      hidden: hiddenOutsideShop,
      validation: requiredInShop,
    }),

    // ── Shipping ──────────────────────────────────────────────────────────────

    defineField({
      name: 'weightKg',
      title: 'Weight (kg)',
      type: 'number',
      description: 'Estimated shipping weight per unit (kg). For loose-link products: weight per individual link — checkout multiplies by totalLinks.',
      hidden: hiddenOutsideShop,
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'size',
      title: 'Shipping Size',
      type: 'string',
      description: "Based on the product's longest dimension (or packaged dimension if larger): Small = up to 40cm, Medium = 40–100cm, Large = 100cm and above (e.g. partitions, anything requiring oversized/freight handling). For loose-link products, use Small regardless of quantity — quantity-based cost is already handled via weight (weightKg × totalLinks), not size.",
      options: {
        list: [
          { title: 'Small',  value: 'small'  },
          { title: 'Medium', value: 'medium' },
          { title: 'Large',  value: 'large'  },
        ],
        layout: 'radio',
      },
      hidden: hiddenOutsideShop,
    }),

    // ── Loose-link specific ────────────────────────────────────────────────────

    defineField({
      name: 'colorOptions',
      title: 'Available Color Options',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'colorOption' }] }],
      description: 'Color options available in the chain builder. Ordered by displayOrder on each colorOption document.',
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) !== 'loose-link',
    }),

    // ── Content ───────────────────────────────────────────────────────────────

    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      hidden: hiddenOutsideShop,
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text', rows: 4, validation: requiredInShop }),
      ],
    }),

    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'object',
      description: 'Short descriptor shown beneath the product title (e.g. material or style summary). Bundle products only.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
      ],
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
    }),

    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'object',
      description: 'Product dimensions displayed in the Dimensions & Materials tab. Bundle products only.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
      ],
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
    }),

    // Fallback AR size when the painting has no size options (or a size has none set).
    arDimensionField('arWidthCm'),
    arDimensionField('arHeightCm'),

    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'object',
      description: 'Materials used, displayed in the Dimensions & Materials tab. Bundle products only.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
      ],
      hidden: ({ document }) => !inShop(document) || (document?.productType as string) === 'loose-link',
    }),

    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      options: {
        list: [
          { title: 'In Stock',      value: 'in_stock'      },
          { title: 'Sold',          value: 'sold'          },
          { title: 'Made to Order', value: 'made_to_order' },
        ],
        layout: 'radio',
      },
      initialValue: 'in_stock',
      hidden: hiddenOutsideShop,
      validation: requiredInShop,
    }),

    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      hidden: hiddenOutsideShop,
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Pin this product to the top of the shop grid',
      hidden: hiddenOutsideShop,
    }),

    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'string',
      description: 'Which shop collection this product belongs to. Controls the filter tabs on the shop page.',
      options: {
        list: [
          { title: 'Aura Link',           value: 'art-links'           }, // stored value unchanged — display name only
          { title: 'Artistic Partitions', value: 'artistic-partitions' },
          { title: 'Paintings',           value: 'paintings'           },
        ],
        layout: 'radio',
      },
      initialValue: 'art-links',
      hidden: hiddenOutsideShop,
      validation: requiredInShop,
    }),
  ],

  preview: {
    select: {
      title:        'title.en',
      productType:  'productType',
      availability: 'availability',
      collection:   'collection',
      media:        'images.0',
      showInShop:      'showInShop',
      showInCatalogue: 'showInCatalogue',
      catalogueType:   'catalogueType',
    },
    prepare({ title, productType, availability, collection, media, showInShop, showInCatalogue, catalogueType }) {
      const catLabel = showInCatalogue
        ? `Catalogue${catalogueType ? ` (${catalogueType.charAt(0).toUpperCase() + catalogueType.slice(1)})` : ''}`
        : ''
      if (showInShop === false) {
        return { title, subtitle: catLabel || 'Hidden', media }
      }
      const typeLabel = productType === 'loose-link' ? 'Loose Link' : 'Bundle'
      const availLabels: Record<string, string> = {
        in_stock: 'In Stock', sold: 'Sold', made_to_order: 'Made to Order',
      }
      const collLabels: Record<string, string> = {
        'art-links': 'Aura Link', 'artistic-partitions': 'Partitions', paintings: 'Paintings',
      }
      const collLabel = collLabels[collection] ?? 'Aura Link'
      return {
        title,
        subtitle: [`Shop: ${typeLabel}`, availLabels[availability] ?? availability, collLabel, catLabel]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
