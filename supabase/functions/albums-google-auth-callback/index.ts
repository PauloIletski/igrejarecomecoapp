import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, options } from "../_shared/albums-cors.ts";
import { parseCookies, setCookie } from "../_shared/albums-google.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(req);
  const savedState = cookies.g_oauth_state;
  const verifier = cookies.g_oauth_verifier;

  if (!code || !state || !savedState || !verifier || state !== savedState) {
    return json(req, { error: "Estado invalido." }, 400);
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) return json(req, { error: "Variaveis do Google nao configuradas." }, 500);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) return json(req, { error: "Falha ao trocar codigo.", details: await tokenRes.text() }, 400);

  const tokens = await tokenRes.json();
  const redirectUrl = Deno.env.get("GOOGLE_POST_LOGIN_REDIRECT") || "/";
  const redirectTarget = redirectUrl.startsWith("http") ? new URL(redirectUrl) : new URL(redirectUrl, req.url);
  redirectTarget.hash = new URLSearchParams({
    googleToken: tokens.access_token,
    googleTokenExp: String(Date.now() + Number(tokens.expires_in || 3600) * 1000),
  }).toString();
  const headers = new Headers({ Location: redirectTarget.toString() });
  setCookie(headers, "g_access_token", tokens.access_token, true);
  setCookie(headers, "g_access_token_client", tokens.access_token, false);
  if (tokens.refresh_token) setCookie(headers, "g_refresh_token", tokens.refresh_token, true);
  setCookie(headers, "g_token_exp", String(Date.now() + Number(tokens.expires_in || 3600) * 1000), true);
  setCookie(headers, "g_oauth_state", "", true, 0);
  setCookie(headers, "g_oauth_verifier", "", true, 0);
  return new Response(null, { status: 302, headers });
});
