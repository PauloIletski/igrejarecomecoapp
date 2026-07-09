type CloudinaryFolder = {
  name: string;
  path: string;
};

type CloudinaryResource = {
  public_id: string;
  format: string;
  width: number;
  height: number;
  created_at?: string;
  bytes?: number;
  secure_url?: string;
  asset_folder?: string;
  folder?: string;
};

const CLOUDINARY_API = "https://api.cloudinary.com/v1_1";

function env(name: string) {
  return Deno.env.get(name) || "";
}

export function cloudName() {
  return env("CLOUDINARY_CLOUD_NAME") || env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME") || env("VITE_CLOUDINARY_CLOUD_NAME") || env("VITE_PUBLIC_CLOUDINARY_CLOUD_NAME");
}

export function cloudinaryRootFolder() {
  return env("CLOUDINARY_ROOT_FOLDER") || "galeries";
}

function authHeaders() {
  const key = env("CLOUDINARY_API_KEY");
  const secret = env("CLOUDINARY_API_SECRET");
  if (!key || !secret) throw new Error("Cloudinary nao configurado.");
  return {
    Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
  };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function readCloudinaryError(res: Response, fallback: string) {
  const text = await res.text().catch(() => "");
  if (!text) return `${fallback} (${res.status})`;
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message || `${fallback} (${res.status})`;
  } catch {
    return `${fallback} (${res.status}): ${text}`;
  }
}

export async function listCloudinaryFolders(folderPath = cloudinaryRootFolder()): Promise<CloudinaryFolder[]> {
  const cloud = cloudName();
  if (!cloud) throw new Error("Cloudinary cloud name nao configurado.");

  const res = await fetch(`${CLOUDINARY_API}/${cloud}/folders/${encodePath(folderPath)}`, {
    headers: authHeaders(),
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(await readCloudinaryError(res, "Falha ao listar pastas Cloudinary"));

  const data = await res.json();
  return Array.isArray(data.folders) ? data.folders : [];
}

export async function listCloudinaryResources(prefix = `${cloudinaryRootFolder()}/`) {
  const cloud = cloudName();
  if (!cloud) throw new Error("Cloudinary cloud name nao configurado.");

  const resources: CloudinaryResource[] = [];
  let nextCursor = "";

  do {
    const body: Record<string, unknown> = {
      expression: "resource_type:image",
      max_results: 500,
      with_field: "context",
    };
    if (nextCursor) body.next_cursor = nextCursor;

    const res = await fetch(`${CLOUDINARY_API}/${cloud}/resources/search`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await readCloudinaryError(res, "Falha ao buscar imagens Cloudinary"));
    const data = await res.json();
    const pageResources = Array.isArray(data.resources) ? data.resources : [];
    resources.push(
      ...pageResources.filter((resource: CloudinaryResource) => {
        const assetFolder = String(resource.asset_folder || resource.folder || "");
        const publicId = String(resource.public_id || "");
        const normalizedPrefix = prefix.replace(/\/$/, "");
        return assetFolder.startsWith(normalizedPrefix) || publicId.startsWith(prefix);
      }),
    );
    nextCursor = data.next_cursor || "";
  } while (nextCursor);

  return resources;
}

export async function getGalleryImages(slug: string) {
  const root = cloudinaryRootFolder();
  const folderPath = `${root}/${slug}`;
  const resources = await listCloudinaryResources(`${root}/`);
  return resources
    .filter((resource) => {
      const assetFolder = String(resource.asset_folder || resource.folder || "");
      const publicId = String(resource.public_id || "");
      return assetFolder === folderPath || publicId.startsWith(`${folderPath}/`);
    })
    .sort((a, b) => String(b.public_id).localeCompare(String(a.public_id)))
    .slice(0, 400);
}

export async function getGalleryFolders() {
  const root = cloudinaryRootFolder().replace(/\/$/, "");
  const resources = await listCloudinaryResources(`${root}/`);
  const folders = new Map<string, CloudinaryResource[]>();

  for (const resource of resources) {
    const assetFolder = String(resource.asset_folder || resource.folder || "");
    const publicId = String(resource.public_id || "");
    const folderPath = assetFolder || publicId.split("/").slice(0, -1).join("/");
    if (!folderPath || folderPath === root || !folderPath.startsWith(`${root}/`)) continue;

    const slug = folderPath.slice(root.length + 1);
    const folderResources = folders.get(slug) || [];
    folderResources.push(resource);
    folders.set(slug, folderResources);
  }

  return Array.from(folders.entries())
    .map(([slug, folderResources]) => {
      const sortedResources = [...folderResources].sort((a, b) => String(b.public_id).localeCompare(String(a.public_id)));
      const thumbnail = sortedResources[0]
        ? {
            public_id: sortedResources[0].public_id,
            format: sortedResources[0].format,
            blurDataUrl:
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          }
        : undefined;

      return {
        slug,
        createdAt: sortedResources[0]?.created_at || new Date().toISOString(),
        thumbnail,
        count: sortedResources.length,
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha1(value: string) {
  const data = new TextEncoder().encode(value);
  return hex(await crypto.subtle.digest("SHA-1", data));
}

async function signCloudinary(params: Record<string, string>) {
  const secret = env("CLOUDINARY_API_SECRET");
  if (!secret) throw new Error("CLOUDINARY_API_SECRET ausente.");
  const source = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return sha1(`${source}${secret}`);
}

export async function uploadToCloudinary(args: {
  file: File;
  slug: string;
}) {
  const cloud = cloudName();
  const apiKey = env("CLOUDINARY_API_KEY");
  if (!cloud || !apiKey) throw new Error("Cloudinary nao configurado.");

  const folder = `${cloudinaryRootFolder()}/${args.slug}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = {
    folder,
    asset_folder: folder,
    use_asset_folder_as_public_id_prefix: "true",
    timestamp,
  };
  const signature = await signCloudinary(params);
  const form = new FormData();
  form.append("file", args.file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("asset_folder", folder);
  form.append("use_asset_folder_as_public_id_prefix", "true");

  const res = await fetch(`${CLOUDINARY_API}/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(await readCloudinaryError(res, "Falha no upload Cloudinary"));
  return res.json();
}

export function publicImageUrl(publicId: string, format: string, transformations = "") {
  const cloud = cloudName();
  const transform = transformations ? `${transformations}/` : "";
  const cleanFormat = format.replace(/[^a-zA-Z0-9]/g, "");
  const cleanPublicId = cleanFormat && publicId.endsWith(`.${cleanFormat}`)
    ? publicId.slice(0, -cleanFormat.length - 1)
    : publicId;
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}${cleanPublicId}.${cleanFormat}`;
}
