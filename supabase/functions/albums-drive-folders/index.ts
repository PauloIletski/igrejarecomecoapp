import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requirePermission } from "../_shared/albums-auth.ts";
import { json, options } from "../_shared/albums-cors.ts";
import { applyGoogleTokenCookies, getGoogleAccessToken, listTopLevelDriveFolders } from "../_shared/albums-google.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  const auth = await requirePermission(req, "albums.manage");
  if (!auth.ok) return json(req, { error: auth.error }, auth.status);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const tokenResult = await getGoogleAccessToken(req, String(body.googleToken || ""));
  if (!tokenResult.accessToken) return json(req, { error: "Nao autenticado no Google." }, 401);

  try {
    const hasConfiguredRoot = Boolean(Deno.env.get("GDRIVE_ROOT_FOLDER"));
    const response = json(req, {
      files: hasConfiguredRoot ? [] : await listTopLevelDriveFolders(tokenResult.accessToken),
      hasConfiguredRoot,
    });
    return applyGoogleTokenCookies(req, response, tokenResult);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Falha ao listar pastas." }, 400);
  }
});
