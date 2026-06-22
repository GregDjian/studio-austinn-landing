import { sanityClient } from "./sanityClient";

/* =========================
   ARTISTS
========================= */
export async function getArtists() {
  return sanityClient.fetch(`
    *[_type == "artist"] | order(_createdAt desc) {
      _id,
      name,
      location,
      collection,
      technique,
      dimensions,
      about,
      coverImage,
      galleryImages
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

/* =========================
   PROJECTS
========================= */

export async function getProjects() {
  return sanityClient.fetch(`
    *[_type == "project"] | order(_createdAt desc) {
      _id,
      title,
      location,
      year,
      size,
      summary,
      sector,
      tags,
      coverImage,
      images
    }
  `);
}

/* =========================
   SHOP PRODUCTS
   Entirely separate from artwork/artist data.
========================= */

export async function getProducts() {
  return sanityClient.fetch(`
    *[_type == "product"] | order(featured desc, _createdAt desc) {
      _id,
      "productType": coalesce(productType, "bundle"),
      title,
      slug,
      images,
      price,
      pricePerLink,
      currency,
      description,
      availability,
      sku,
      featured,
      collection
    }
  `);
}

export async function getProductBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "product" && slug.current == $slug][0] {
      _id,
      "productType": coalesce(productType, "bundle"),
      title,
      slug,
      images,
      price,
      pricePerLink,
      currency,
      description,
      availability,
      sku,
      featured,
      "colorOptions": colorOptions[]->{
        _id,
        name,
        image,
        hexSwatch,
        displayOrder
      }
    }`,
    { slug }
  );
}

/* =========================
   DELIVERY ZONES
========================= */

export interface DeliveryZone {
  _id: string;
  zoneKey: "uae" | "gcc";
  zoneName: { en: string; ar: string };
  rate: number;
  currency: string;
  installationFee?: number;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  return sanityClient.fetch(`
    *[_type == "deliveryZone"] {
      _id,
      zoneKey,
      zoneName,
      rate,
      currency,
      installationFee
    }
  `);
}

/* =========================
   SHOP COLLECTIONS
   Metadata documents for collection filter tiles (images, display names).
   The product.collection enum value maps to CollectionMeta.key.
========================= */

export interface CollectionMeta {
  _id: string;
  key: string;
  name: { en: string; ar: string };
  image?: any;
  order: number;
}

export async function getCollections(): Promise<CollectionMeta[]> {
  return sanityClient.fetch(`
    *[_type == "collectionMeta"] | order(order asc) {
      _id,
      key,
      name,
      image,
      order
    }
  `);
}

export async function getColorOptions() {
  return sanityClient.fetch(`
    *[_type == "colorOption"] | order(displayOrder asc) {
      _id,
      name,
      image,
      hexSwatch,
      displayOrder
    }
  `);
}