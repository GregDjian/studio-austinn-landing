import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Artwork Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Artwork Type',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Painting', value: 'painting' },
          { title: 'Sculpture', value: 'sculpture' },
          { title: 'Chandelier', value: 'chandelier' },
          { title: 'Installation', value: 'installation' },
          { title: 'Bespoke', value: 'bespoke' },
        ],
        layout: 'radio', // clean UX in Studio
      },
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) =>
        Rule.required().max(40).error('Description must be 40 characters or less'),
    }),


    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      type: 'type',
    },
    prepare({ title, media, type }) {
      return {
        title,
        media,
        subtitle: type ? type.charAt(0).toUpperCase() + type.slice(1) : '',
      }
    },
  },
})
