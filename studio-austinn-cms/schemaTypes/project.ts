import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'sector',
      title: 'Sector',
      type: 'string',
      description: 'Which environment category this project belongs to',
      options: {
        list: [
          { title: 'Private Villas',  value: 'Private Villas'  },
          { title: 'Hospitality',     value: 'Hospitality'     },
          { title: 'Yachts & Jets',   value: 'Yachts & Jets'   },
          { title: 'Design Partners', value: 'Design Partners' },
          { title: 'Luxury Retail',   value: 'Luxury Retail'   },
          { title: 'Public Spaces',   value: 'Public Spaces'   },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Palm Jumeirah, Dubai',
    }),

    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'e.g. 2024',
    }),

    defineField({
      name: 'size',
      title: 'Scale / Size',
      type: 'string',
      description: 'e.g. 320 m², 22 m height, 45 m yacht',
    }),

    defineField({
      name: 'summary',
      title: 'Project Summary',
      type: 'text',
      rows: 5,
      description: 'Short description of the project and its artistic intent',
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'e.g. Sculpture, Marble, Site-specific',
    }),

    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
      description: 'Additional project images shown in the detail view',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'sector',
      media: 'coverImage',
    },
  },
})