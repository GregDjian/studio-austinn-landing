import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'deliveryZone',
  title: 'Delivery Zone',
  type: 'document',

  fields: [
    defineField({
      name: 'zoneKey',
      title: 'Zone Key (internal)',
      type: 'string',
      description: 'Internal key used by checkout to map countries → this zone. Set once, do not rename.',
      options: {
        list: [
          { title: 'UAE',         value: 'uae' },
          { title: 'Rest of GCC', value: 'gcc' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'zoneName',
      title: 'Zone Name',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'ar', title: 'Arabic',  type: 'string', validation: (Rule) => Rule.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'weightTiers',
      title: 'Weight Tiers',
      type: 'array',
      description: 'Delivery rate bands by total cart weight (kg). Checkout picks the first tier where totalWeight ≥ minKg and (totalWeight < maxKg or maxKg is blank).',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'minKg',
              title: 'Min Weight (kg)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'maxKg',
              title: 'Max Weight (kg)',
              type: 'number',
              description: 'Leave blank for "and above" (open-ended upper tier).',
            }),
            defineField({
              name: 'rate',
              title: 'Rate (AED)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: { minKg: 'minKg', maxKg: 'maxKg', rate: 'rate' },
            prepare({ minKg, maxKg, rate }: { minKg?: number; maxKg?: number; rate?: number }) {
              const range = maxKg != null
                ? `${minKg ?? 0} – ${maxKg} kg`
                : `${minKg ?? 0} kg and above`
              return { title: range, subtitle: `AED ${rate ?? '—'}` }
            },
          },
        },
      ],
      initialValue: [
        { minKg: 0,  maxKg: 2,  rate: 35  },
        { minKg: 2,  maxKg: 10, rate: 60  },
        { minKg: 10,            rate: 100 },
      ],
    }),

    defineField({
      name: 'sizeTiers',
      title: 'Size Tiers',
      type: 'array',
      description: 'Delivery rate per parcel size. Checkout uses the largest size present anywhere in the cart.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: [
                  { title: 'Small',  value: 'small'  },
                  { title: 'Medium', value: 'medium' },
                  { title: 'Large',  value: 'large'  },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'rate',
              title: 'Rate (AED)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: { size: 'size', rate: 'rate' },
            prepare({ size, rate }: { size?: string; rate?: number }) {
              const label = size ? size.charAt(0).toUpperCase() + size.slice(1) : '—'
              return { title: label, subtitle: `AED ${rate ?? '—'}` }
            },
          },
        },
      ],
      initialValue: [
        { size: 'small',  rate: 35  },
        { size: 'medium', rate: 60  },
        { size: 'large',  rate: 120 },
      ],
    }),

    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'AED',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'installationFee',
      title: 'Installation Fee (Dubai only)',
      type: 'number',
      description: 'Optional flat fee for professional installation. Shown only when customer selects Dubai. Leave blank or 0 if not offered.',
    }),
  ],

  preview: {
    select: {
      name:     'zoneName.en',
      currency: 'currency',
      install:  'installationFee',
    },
    prepare({ name, currency, install }: { name?: string; currency?: string; install?: number }) {
      const cur = currency ?? 'AED'
      const sub = install
        ? `Tiered pricing · Install ${cur} ${install}`
        : 'Tiered pricing'
      return { title: name ?? 'Unnamed zone', subtitle: sub }
    },
  },
})
