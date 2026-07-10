import { File, Paths } from "expo-file-system";

import { getRequiredSupabaseEnv } from "@/lib/env";

import { GalleryFolder, GalleryImage } from "./types";
import { downloadFilename } from "./utils";

function albumsFunctionUrl(name: string) {
  const { url } = getRequiredSupabaseEnv();
  return `${url.replace(/\/$/, "")}/functions/v1/${name}`;
}

async function callAlbumFunction<T>(name: string, init: RequestInit = {}) {
  const { publishableKey } = getRequiredSupabaseEnv();
  const headers = {
    apikey: publishableKey,
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string> | undefined),
  };

  const response = await fetch(albumsFunctionUrl(name), {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Falha ao carregar albuns.");
  }

  return data as T;
}

export async function fetchGalleries() {
  const data = await callAlbumFunction<{ galleries: GalleryFolder[] }>("albums-galleries", {
    method: "GET",
  });

  return data.galleries ?? [];
}

export async function fetchGalleryImages(slug: string) {
  const data = await callAlbumFunction<{ images: GalleryImage[] }>("albums-gallery-images", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });

  return data.images ?? [];
}

export function albumImageDownloadUrl(image: GalleryImage, title: string, index: number) {
  const params = new URLSearchParams({
    publicId: image.public_id,
    format: image.format,
    filename: downloadFilename(title, index, image.format),
  });

  return `${albumsFunctionUrl("albums-download")}?${params.toString()}`;
}

export async function downloadGalleryImage(image: GalleryImage, title: string, index: number) {
  const { publishableKey } = getRequiredSupabaseEnv();
  const filename = downloadFilename(title, index, image.format);
  const target = new File(Paths.cache, filename);

  return File.downloadFileAsync(albumImageDownloadUrl(image, title, index), target, {
    headers: { apikey: publishableKey },
    idempotent: true,
  });
}
