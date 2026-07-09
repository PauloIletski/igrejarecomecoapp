import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { cloudName } from "../_shared/albums-cloudinary.ts";
import { corsHeaders, json, options } from "../_shared/albums-cors.ts";

function sanitizeFilename(filename: string) {
  return filename.replace(/[\r\n"\\]/g, "_") || "image.jpg";
}

function encodePublicId(publicId: string) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  const url = new URL(req.url);
  const publicId = url.searchParams.get("publicId");
  const format = url.searchParams.get("format");
  const filename = sanitizeFilename(url.searchParams.get("filename") || "image.jpg");
  const cloud = cloudName();

  if (!cloud || !publicId || !format) return json(req, { error: "Parametros de download invalidos." }, 400);

  const normalizedFormat = format.replace(/[^a-zA-Z0-9]/g, "");
  const sourceUrl = `https://res.cloudinary.com/${cloud}/image/upload/${encodePublicId(publicId)}.${normalizedFormat}`;
  const upstream = await fetch(sourceUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return json(req, { error: "Nao foi possivel baixar a imagem." }, 502);

  const headers = new Headers(corsHeaders(req));
  headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  headers.set("Cache-Control", "private, no-store");
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  return new Response(upstream.body, { headers });
});
