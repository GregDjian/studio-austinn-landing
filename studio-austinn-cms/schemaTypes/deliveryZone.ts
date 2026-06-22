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
      name: 'rate',
      title: 'Delivery Rate',
      type: 'number',
      description: 'Flat delivery fee for this zone (AED)',
      validation: (Rule) => Rule.required().min(0),
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
      rate:     'rate',
      currency: 'currency',
      install:  'installationFee',
    },
    prepare({ name, rate, currency, install }) {
      const cur = currency ?? 'AED'
      const sub = install
        ? `Delivery ${cur} ${rate ?? 0} · Install ${cur} ${install}`
        : `Delivery ${cur} ${rate ?? 0}`
      return { title: name ?? 'Unnamed zone', subtitle: sub }
    },
  },
})
