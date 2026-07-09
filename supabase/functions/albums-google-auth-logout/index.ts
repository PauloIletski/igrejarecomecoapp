import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, options } from "../_shared/albums-cors.ts";
import { clearGoogleCookies } from "../_shared/albums-google.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return options(req);
  const headers = new Headers({ ...corsHeaders(req), "Content-Type": "application/json" });
  clearGoogleCookies(headers);
  return new Response(JSON.stringify({ success: true }), { headers });
});
