import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.[key]) {
      return import.meta.env[key];
    }
  } catch {}
  return (typeof process !== "undefined" && process.env[key]) || "";
};

export const sanityClient = createClient({
  projectId: getEnvVar("VITE_SANITY_PROJECT_ID") || "placeholder",
  dataset: getEnvVar("VITE_SANITY_DATASET") || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: any) =>
  builder.image(source).auto("format").quality(80);