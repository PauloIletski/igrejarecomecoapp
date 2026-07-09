import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, options } from "../_shared/albums-cors.ts";
import { setCookie } from "../_shared/albums-google.ts";

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
  if (!clientId || !redirectUri) return json(req, { error: "GOOGLE_CLIENT_ID/GOOGLE_REDIRECT_URI nao configurados." }, 500);

  const verifierBytes = new Uint8Array(32);
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(verifierBytes);
  crypto.getRandomValues(stateBytes);
  const verifier = base64url(verifierBytes);
  const state = base64url(stateBytes);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    state,
    code_challenge: await sha256(verifier),
    code_challenge_method: "S256",
    prompt: "consent",
  });

  const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  setCookie(headers, "g_oauth_state", state, true);
  setCookie(headers, "g_oauth_verifier", verifier, true);
  return new Response(null, { status: 302, headers });
});
