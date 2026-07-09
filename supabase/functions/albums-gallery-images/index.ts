import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getGalleryImages } from "../_shared/albums-cloudinary.ts";
import { json, options } from "../_shared/albums-cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const slug = String(body.slug || url.searchParams.get("slug") || "").trim();
    if (!slug) return json(req, { error: "Slug obrigatorio." }, 400);

    const resources = await getGalleryImages(slug);
    return json(req, {
      images: resources.map((resource, index) => ({
        id: index,
        public_id: resource.public_id,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        isPortrait: resource.height > resource.width,
        tags: [],
        blurDataUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      })),
    });
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Falha ao carregar imagens." }, 500);
  }
});
