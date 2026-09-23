import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "./sanityClient";

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

export const imgUrl = {
  thumb: (src: any) => urlFor(src).width(400).auto("format").url(),
  card:  (src: any) => urlFor(src).width(800).auto("format").url(),
  full:  (src: any) => urlFor(src).width(1400).auto("format").url(),
  // Always JPEG: embedded as the AR model's texture (GLB / USDZ).
  ar:    (src: any) => urlFor(src).width(2048).format("jpg").quality(90).url(),
};
