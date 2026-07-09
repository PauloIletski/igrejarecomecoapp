import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requirePermission } from "../_shared/albums-auth.ts";
import { uploadToCloudinary } from "../_shared/albums-cloudinary.ts";
import { json, options } from "../_shared/albums-cors.ts";
import { applyGoogleTokenCookies, getGoogleAccessToken, uploadToGoogleDrive } from "../_shared/albums-google.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  const auth = await requirePermission(req, "albums.manage");
  if (!auth.ok) return json(req, { error: auth.error }, auth.status);

  try {
    const formData = await req.formData();
    const slug = String(formData.get("slug") || "").trim();
    const albumPath = String(formData.get("albumPath") || slug).trim();
    const driveParentId = String(formData.get("driveParentId") || "").trim();
    const googleToken = String(formData.get("googleToken") || "").trim();
    const file = formData.get("file");

    if (!slug) return json(req, { error: "slug e obrigatorio." }, 400);
    if (!(file instanceof File)) return json(req, { error: "arquivo e obrigatorio." }, 400);

    const tokenResult = await getGoogleAccessToken(req, googleToken);
    if (!tokenResult.accessToken) {
      return json(req, { error: "Faca login no Google para manter o backup obrigatorio no Drive." }, 401);
    }

    if (!driveParentId && !Deno.env.get("GDRIVE_ROOT_FOLDER")) {
      return json(req, { error: "Selecione a pasta raiz existente do Google Drive." }, 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const drive = await uploadToGoogleDrive({
      accessToken: tokenResult.accessToken,
      albumName: albumPath,
      fileName: file.name || "imagem",
      fileBuffer: buffer,
      mimeType: file.type || "image/jpeg",
      parentIdOverride: driveParentId || undefined,
    });

    if (!drive?.success) {
      return json(req, { error: drive?.message || "Falha ao criar backup obrigatorio no Drive.", drive }, 502);
    }

    const cloudinary = await uploadToCloudinary({ file, slug });
    const response = json(req, { success: true, cloudinary, drive });
    return applyGoogleTokenCookies(req, response, tokenResult);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Falha no upload." }, 500);
  }
});
