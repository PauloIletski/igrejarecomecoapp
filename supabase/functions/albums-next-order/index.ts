import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requirePermission } from "../_shared/albums-auth.ts";
import { listCloudinaryFolders, cloudinaryRootFolder } from "../_shared/albums-cloudinary.ts";
import { json, options } from "../_shared/albums-cors.ts";
import { applyGoogleTokenCookies, getGoogleAccessToken, listDriveItemNamesAtPath, resolveDriveRootFolderId } from "../_shared/albums-google.ts";
import { getAlbumOrderInfo, MONTHS } from "../_shared/albums-order.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "Metodo nao permitido." }, 405);

  const auth = await requirePermission(req, "albums.manage");
  if (!auth.ok) return json(req, { error: auth.error }, auth.status);

  const url = new URL(req.url);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const year = String(body.year || url.searchParams.get("year") || "").trim();
  const month = Number(body.month || url.searchParams.get("month"));
  const driveParentId = String(body.driveParentId || url.searchParams.get("driveParentId") || "").trim();
  const monthName = MONTHS[month - 1];

  if (!year || !monthName) return json(req, { error: "Ano e mes sao obrigatorios." }, 400);

  const folderPath = `${cloudinaryRootFolder()}/${year}/${month}.${monthName}`;
  const driveFolderPath = `${year}/${month}.${monthName}`;

  try {
    const folderNames = new Set<string>();
    const cloudinaryFolders = await listCloudinaryFolders(folderPath);
    cloudinaryFolders.forEach((folder) => folderNames.add(folder.name));

    let driveWarning: string | undefined;
    const tokenResult = await getGoogleAccessToken(req, String(body.googleToken || ""));
    if (tokenResult.accessToken) {
      try {
        const driveRootFolder = await resolveDriveRootFolderId({
          accessToken: tokenResult.accessToken,
          parentIdOverride: driveParentId || undefined,
        });
        if (driveRootFolder) {
          const names = await listDriveItemNamesAtPath({
            accessToken: tokenResult.accessToken,
            parentId: driveRootFolder,
            folderPath: driveFolderPath,
          });
          names.forEach((name: string) => folderNames.add(name));
        }
      } catch (error) {
        driveWarning = `Nao foi possivel consultar itens legados no Google Drive: ${error instanceof Error ? error.message : "erro desconhecido"}`;
      }
    }

    const response = json(req, {
      folderPath,
      driveFolderPath,
      driveWarning,
      ...getAlbumOrderInfo(Array.from(folderNames)),
    });
    return applyGoogleTokenCookies(req, response, tokenResult);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Falha ao verificar pastas existentes." }, 500);
  }
});
