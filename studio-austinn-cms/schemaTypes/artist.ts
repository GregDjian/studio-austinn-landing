import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Artist Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),

    defineField({
      name: 'collection',
      title: 'Collection Name',
      type: 'string',
      description: 'Main body of work or artistic collection',
    }),

    defineField({
      name: 'technique',
      title: 'Technique',
      type: 'string',
      description: 'Materials / process (e.g. Oil on canvas, Bronze casting, Glass)',
    }),

    defineField({
      name: 'dimensions',
      title: 'Typical Dimensions',
      type: 'string',
      description: 'Usual scale or size range of the works',
    }),

    defineField({
      name: 'about',
      title: 'About the Artist',
      type: 'text',
      rows: 5,
      description: 'Short biography or artistic statement',
    }),

    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'gallery',
      title: 'Artist Gallery (up to 3 images)',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
      validation: (Rule) => Rule.max(3),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      media: 'coverImage',
    },
  },
})
