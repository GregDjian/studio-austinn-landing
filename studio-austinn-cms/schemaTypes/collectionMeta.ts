import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'collectionMeta',
  title: 'Shop Collection',
  type: 'document',

  fields: [
    defineField({
      name: 'key',
      title: 'Collection Key (internal)',
      type: 'string',
      description: 'Must match the collection value on product documents. Do not rename once set.',
      options: {
        list: [
          { title: 'Art Links',           value: 'art-links'           },
          { title: 'Artistic Partitions', value: 'artistic-partitions' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'name',
      title: 'Display Name',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'ar', title: 'Arabic',  type: 'string', validation: (Rule) => Rule.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Thumbnail Image',
      type: 'image',
      description: 'Shown in the shop collection filter tile. Aim for a square or portrait crop.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the filter row.',
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      title: 'name.en',
      key:   'key',
      media: 'image',
    },
    prepare({ title, key, media }) {
      return {
        title:    title ?? key ?? 'Unnamed collection',
        subtitle: key,
        media,
      }
    },
  },
})
