import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Shop Product',
  type: 'document',

  fields: [
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
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'ar', title: 'Arabic',  type: 'string', validation: (Rule) => Rule.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Cover image(s) shown in the shop grid. For loose-link products, also used as the product hero.',
      validation: (Rule) => Rule.required().min(1),
    }),

    // ── Pricing ───────────────────────────────────────────────────────────────

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Flat price for bundle products. Not used for loose-link products.',
      hidden: ({ document }) => (document?.productType as string) === 'loose-link',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const type = (context.document?.productType as string) ?? 'bundle'
          if (type !== 'loose-link' && (value === undefined || value === null)) {
            return 'Price is required for bundle products'
          }
          if (value !== undefined && value !== null && (value as number) <= 0) {
            return 'Price must be a positive number'
          }
          return true
        }),
    }),

    defineField({
      name: 'pricePerLink',
      title: 'Price Per Link',
      type: 'number',
      description: 'Price charged per individual chain link. Used for loose-link products only.',
      hidden: ({ document }) => (document?.productType as string) !== 'loose-link',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const type = (context.document?.productType as string) ?? 'bundle'
          if (type === 'loose-link' && (value === undefined || value === null)) {
            return 'Price per link is required for loose-link products'
          }
          if (value !== undefined && value !== null && (value as number) <= 0) {
            return 'Price per link must be a positive number'
          }
          return true
        }),
    }),

    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'AED',
      validation: (Rule) => Rule.required(),
    }),

    // ── Shipping ──────────────────────────────────────────────────────────────

    defineField({
      name: 'weightKg',
      title: 'Weight (kg)',
      type: 'number',
      description: 'Estimated shipping weight per unit (kg). For loose-link products: weight per individual link — checkout multiplies by totalLinks.',
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
    }),

    // ── Loose-link specific ────────────────────────────────────────────────────

    defineField({
      name: 'colorOptions',
      title: 'Available Color Options',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'colorOption' }] }],
      description: 'Color options available in the chain builder. Ordered by displayOrder on each colorOption document.',
      hidden: ({ document }) => (document?.productType as string) !== 'loose-link',
    }),

    // ── Content ───────────────────────────────────────────────────────────────

    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text', rows: 4, validation: (Rule) => Rule.required() }),
        defineField({ name: 'ar', title: 'Arabic',  type: 'text', rows: 4, validation: (Rule) => Rule.required() }),
      ],
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
      name: 'sku',
      title: 'SKU',
      type: 'string',
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Pin this product to the top of the shop grid',
    }),

    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'string',
      description: 'Which shop collection this product belongs to. Controls the filter tabs on the shop page.',
      options: {
        list: [
          { title: 'Art Links',           value: 'art-links'           },
          { title: 'Artistic Partitions', value: 'artistic-partitions' },
        ],
        layout: 'radio',
      },
      initialValue: 'art-links',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title:        'title.en',
      productType:  'productType',
      availability: 'availability',
      collection:   'collection',
      media:        'images.0',
    },
    prepare({ title, productType, availability, collection, media }) {
      const typeLabel = productType === 'loose-link' ? 'Loose Link' : 'Bundle'
      const availLabels: Record<string, string> = {
        in_stock: 'In Stock', sold: 'Sold', made_to_order: 'Made to Order',
      }
      const collLabel = collection === 'artistic-partitions' ? 'Partitions' : 'Art Links'
      return {
        title,
        subtitle: `${typeLabel} · ${availLabels[availability] ?? availability} · ${collLabel}`,
        media,
      }
    },
  },
})
