import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: true, // fast + cheap
});

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: any) => builder.image(source);
