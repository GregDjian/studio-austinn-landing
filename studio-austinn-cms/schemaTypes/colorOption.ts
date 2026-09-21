import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'colorOption',
  title: 'Chain Color Option',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'ar', title: 'Arabic',  type: 'string', validation: (Rule) => Rule.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Link Photograph',
      type: 'image',
      options: { hotspot: true },
      description: 'Transparent PNG of the chain link — used in the live builder preview.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'sideViewImage',
      title: 'Side View Photograph',
      type: 'image',
      options: { hotspot: true },
      description:
        'Transparent PNG of the same link photographed from the side. The builder preview alternates face view (Link Photograph) and side view: 1st, 3rd, 5th… link = face, 2nd, 4th, 6th… link = side. Optional — without it every link uses the face view.',
    }),

    defineField({
      name: 'hexSwatch',
      title: 'Hex Swatch',
      type: 'string',
      description: 'Fallback colour dot shown in the picker before the image loads (e.g. #A87C4F).',
    }),

    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the colour picker.',
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      title:    'name.en',
      subtitle: 'hexSwatch',
      media:    'image',
    },
  },
})
