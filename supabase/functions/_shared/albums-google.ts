import { corsHeaders } from "./albums-cors.ts";

type GoogleTokenResult = {
  accessToken: string;
  refreshedToken?: {
    accessToken: string;
    expiresAt: number;
  };
};

const cookieBase = "Path=/; SameSite=Lax";
const secureCookie = Deno.env.get("ENVIRONMENT") === "production" || Deno.env.get("DENO_DEPLOYMENT_ID");

function cookieOptions(httpOnly: boolean, maxAge?: number) {
  return [
    cookieBase,
    secureCookie ? "Secure" : "",
    httpOnly ? "HttpOnly" : "",
    typeof maxAge === "number" ? `Max-Age=${maxAge}` : "",
  ].filter(Boolean).join("; ");
}

export function parseCookies(req: Request) {
  return (req.headers.get("Cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const [name, ...valueParts] = part.split("=");
      if (name) cookies[name] = decodeURIComponent(valueParts.join("=") || "");
      return cookies;
    }, {});
}

export function setCookie(headers: Headers, name: string, value: string, httpOnly = true, maxAge?: number) {
  headers.append("Set-Cookie", `${name}=${encodeURIComponent(value)}; ${cookieOptions(httpOnly, maxAge)}`);
}

export function clearGoogleCookies(headers: Headers) {
  for (const name of ["g_access_token", "g_access_token_client", "g_refresh_token", "g_token_exp", "g_oauth_state", "g_oauth_verifier"]) {
    setCookie(headers, name, "", name !== "g_access_token_client", 0);
  }
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const tokens = await res.json();
  if (!tokens.access_token) return null;
  return {
    accessToken: tokens.access_token as string,
    expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000,
  };
}

export async function getGoogleAccessToken(req: Request, fallbackToken = ""): Promise<GoogleTokenResult> {
  const cookies = parseCookies(req);
  const cookieToken = cookies.g_access_token || "";
  const refreshToken = cookies.g_refresh_token || "";
  const expiresAt = Number(cookies.g_token_exp || 0);
  const googleHeaderToken = req.headers.get("X-Google-Access-Token") || "";

  if (refreshToken && (!cookieToken || !expiresAt || Date.now() > expiresAt - 60_000)) {
    const refreshedToken = await refreshGoogleAccessToken(refreshToken);
    if (refreshedToken) return { accessToken: refreshedToken.accessToken, refreshedToken };
  }

  return { accessToken: cookieToken || fallbackToken || googleHeaderToken };
}

export function applyGoogleTokenCookies(req: Request, response: Response, tokenResult: GoogleTokenResult) {
  if (!tokenResult.refreshedToken) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(req))) headers.set(key, value);
  setCookie(headers, "g_access_token", tokenResult.refreshedToken.accessToken, true);
  setCookie(headers, "g_access_token_client", tokenResult.refreshedToken.accessToken, false);
  setCookie(headers, "g_token_exp", String(tokenResult.refreshedToken.expiresAt), true);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function getDriveErrorMessage(response: Response, fallback: string) {
  const details = await response.text().catch(() => "");
  if (!details) return `${fallback} (${response.status})`;
  try {
    const parsed = JSON.parse(details) as { error?: { message?: string } };
    return `${fallback} (${response.status}): ${parsed.error?.message || details}`;
  } catch {
    return `${fallback} (${response.status}): ${details}`;
  }
}

function driveFilesUrl(params: Record<string, string>) {
  return "https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    ...params,
  });
}

async function findDriveFolder(args: { accessToken: string; folderName: string; parentId?: string }) {
  const nameEscaped = args.folderName.replace(/'/g, "\\'");
  const qParts = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${nameEscaped}'`,
  ];
  if (args.parentId) qParts.push(`'${args.parentId}' in parents`);

  const res = await fetch(driveFilesUrl({ q: qParts.join(" and "), fields: "files(id,name)" }), {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha ao buscar pasta no Drive"));
  const data = await res.json();
  return data.files?.[0] || null;
}

async function ensureDriveFolder(args: { accessToken: string; folderName: string; parentId?: string }) {
  const found = await findDriveFolder(args);
  if (found?.id) return found.id as string;

  const res = await fetch("https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({ supportsAllDrives: "true" }), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: args.folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: args.parentId ? [args.parentId] : undefined,
    }),
  });

  if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha ao criar pasta no Drive"));
  const data = await res.json();
  return data.id as string;
}

export async function resolveDriveRootFolderId(args: { accessToken: string; parentIdOverride?: string; createIfMissing?: boolean }) {
  if (args.parentIdOverride) return args.parentIdOverride;
  const configuredRoot = Deno.env.get("GDRIVE_ROOT_FOLDER");
  if (configuredRoot) return configuredRoot;

  const rootName = Deno.env.get("GDRIVE_ROOT_FOLDER_NAME") || "Issacar Imagens";
  const rootFolder = await findDriveFolder({ accessToken: args.accessToken, folderName: rootName });
  if (rootFolder?.id) return rootFolder.id as string;
  if (!args.createIfMissing) return null;
  return ensureDriveFolder({ accessToken: args.accessToken, folderName: rootName });
}

async function ensureDrivePath(args: { accessToken: string; folderPath: string; parentId?: string }) {
  const folderNames = args.folderPath.split("/").map((part) => part.trim()).filter(Boolean);
  let currentParentId = args.parentId;
  for (const folderName of folderNames) {
    currentParentId = await ensureDriveFolder({ accessToken: args.accessToken, folderName, parentId: currentParentId });
  }
  return currentParentId;
}

async function findDriveFile(args: { accessToken: string; fileName: string; parentId: string }) {
  const nameEscaped = args.fileName.replace(/'/g, "\\'");
  const q = ["trashed = false", `name = '${nameEscaped}'`, `'${args.parentId}' in parents`].join(" and ");
  const res = await fetch(driveFilesUrl({ q, fields: "files(id,name,parents)" }), {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha ao verificar arquivo no Drive"));
  const data = await res.json();
  return data.files?.[0] || null;
}

async function listDriveChildItems(args: { accessToken: string; parentId: string }) {
  const q = ["trashed = false", `'${args.parentId}' in parents`].join(" and ");
  const res = await fetch(driveFilesUrl({ q, fields: "files(id,name,mimeType)", pageSize: "1000", orderBy: "name" }), {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha ao listar itens no Drive"));
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
}

async function findDriveFolderIdByPath(args: { accessToken: string; parentId?: string; folderPath: string }) {
  const folderNames = args.folderPath.split("/").map((part) => part.trim()).filter(Boolean);
  let currentParentId = args.parentId;
  for (const folderName of folderNames) {
    const folder = await findDriveFolder({ accessToken: args.accessToken, folderName, parentId: currentParentId });
    if (!folder?.id) return null;
    currentParentId = folder.id;
  }
  return currentParentId || null;
}

export async function listDriveItemNamesAtPath(args: { accessToken: string; parentId?: string; folderPath: string }) {
  const parentFolderId = await findDriveFolderIdByPath(args);
  if (!parentFolderId) return [];
  const items = await listDriveChildItems({ accessToken: args.accessToken, parentId: parentFolderId });
  return items.map((item: { name: string }) => item.name);
}

export async function listTopLevelDriveFolders(accessToken: string) {
  const qs = new URLSearchParams({
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: "files(id,name)",
    pageSize: "100",
    orderBy: "name",
  });
  const res = await fetch("https://www.googleapis.com/drive/v3/files?" + qs.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha ao listar pastas"));
  const data = await res.json();
  return data.files || [];
}

export async function uploadToGoogleDrive(args: {
  accessToken: string;
  albumName: string;
  fileName: string;
  fileBuffer: Uint8Array;
  mimeType: string;
  parentIdOverride?: string;
}) {
  try {
    const driveRootFolder = await resolveDriveRootFolderId({
      accessToken: args.accessToken,
      parentIdOverride: args.parentIdOverride,
      createIfMissing: true,
    });
    if (!driveRootFolder) return { success: false, message: "Falha ao localizar pasta raiz no Drive" };

    const albumFolderId = await ensureDrivePath({ accessToken: args.accessToken, folderPath: args.albumName, parentId: driveRootFolder });
    if (!albumFolderId) return { success: false, message: "Falha ao garantir pasta no Drive" };

    const existingFile = await findDriveFile({ accessToken: args.accessToken, fileName: args.fileName, parentId: albumFolderId });
    if (existingFile) return { success: true, file: existingFile, skipped: true };

    const boundary = "xxxxxxxxxx" + Math.random().toString(16).slice(2);
    const meta = { name: args.fileName, parents: [albumFolderId] };
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const encoder = new TextEncoder();
    const bodyStart = encoder.encode(delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(meta) + "\r\n" + `--${boundary}\r\n` + `Content-Type: ${args.mimeType}\r\n\r\n`);
    const bodyEnd = encoder.encode(closeDelimiter);
    const body = new Uint8Array(bodyStart.length + args.fileBuffer.length + bodyEnd.length);
    body.set(bodyStart);
    body.set(args.fileBuffer, bodyStart.length);
    body.set(bodyEnd, bodyStart.length + args.fileBuffer.length);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?" + new URLSearchParams({
      uploadType: "multipart",
      fields: "id,name,parents",
      supportsAllDrives: "true",
    }), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    });

    if (!res.ok) throw new Error(await getDriveErrorMessage(res, "Falha no upload do arquivo no Drive"));
    return { success: true, file: await res.json() };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Falha no Google Drive" };
  }
}
