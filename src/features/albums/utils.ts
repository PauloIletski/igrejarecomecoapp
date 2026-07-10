import { env } from "@/lib/env";

export function cloudinaryImageUrl(
  publicId: string,
  format: string,
  transformations = "c_scale,w_1200,q_auto",
) {
  if (!env.cloudinaryCloudName || !publicId) {
    return "";
  }

  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const cleanPublicId =
    cleanFormat && publicId.endsWith(`.${cleanFormat}`)
      ? publicId.slice(0, -cleanFormat.length - 1)
      : publicId;
  const transform = transformations ? `${transformations}/` : "";

  return `https://res.cloudinary.com/${env.cloudinaryCloudName}/image/upload/${transform}${cleanPublicId}.${cleanFormat}`;
}

export function albumTitle(slug: string) {
  const title = slug.split("/").filter(Boolean).pop() ?? slug;

  return title
    .replace(/^\d+\./, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function albumWebPath(slug: string) {
  return `/albums/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export function albumShareUrl(slug: string) {
  const siteUrl = env.siteUrl.replace(/\/$/, "");
  const path = albumWebPath(slug);

  return siteUrl ? `${siteUrl}${path}` : path;
}

export function photoShareUrl(slug: string, index: number) {
  return `${albumShareUrl(slug)}?photoId=${index}`;
}

export function albumHref(slug: string) {
  return albumWebPath(slug);
}

export function downloadFilename(albumName: string, order: number, format: string) {
  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const cleanAlbumName =
    albumName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "album";
  const photoNumber = String(order + 1).padStart(3, "0");

  return `igreja-recomeco-${cleanAlbumName}-${photoNumber}.${cleanFormat}`;
}
