import { sanityClient } from "./sanityClient";

/* =========================
   ARTISTS
========================= */
export async function getArtists() {
  return sanityClient.fetch(`
    *[_type == "artist"] | order(_createdAt desc) {
      _id,
      name,
      collectionName,
      technique,
      dimensions,
      aboutArtist,
      coverImage,
      galleryImages[]
    }
  `);
}

/* =========================
   ARTWORKS
========================= */
export async function getArtworks() {
  return sanityClient.fetch(`
    *[_type == "artwork"] | order(_createdAt desc) {
      _id,
      title,
      type,
      description,
      coverImage
    }
  `);
}
