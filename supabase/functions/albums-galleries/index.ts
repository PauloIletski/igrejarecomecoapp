import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getGalleryFolders } from "../_shared/albums-cloudinary.ts";
import { json, options } from "../_shared/albums-cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  try {
    return json(req, { galleries: await getGalleryFolders() });
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Falha ao carregar albuns." }, 500);
  }
});
