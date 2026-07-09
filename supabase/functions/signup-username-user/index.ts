import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const USERNAME_EMAIL_DOMAIN = "users.issacar.local";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metodo nao permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Configuracao do Supabase ausente." }, 500);

  const body = await req.json().catch(() => ({}));
  const username = normalizeUsername(String(body.username ?? ""));
  const displayName = String(body.displayName ?? username).trim();
  const contactEmail = String(body.contactEmail ?? "").trim() || null;
  const password = String(body.password ?? "");

  if (username.length < 3) return json({ error: "Informe um nome de usuario com pelo menos 3 caracteres." }, 400);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return json({ error: "Informe um e-mail valido ou deixe o campo em branco." }, 400);
  }
  if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminClient.auth.admin.createUser({
    email: `${username}@${USERNAME_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: {
      name: displayName || username,
      username,
      contact_email: contactEmail,
      uses_username_login: true,
    },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already")
      ? "Este nome de usuario ja esta cadastrado."
      : error.message;
    return json({ error: message }, 400);
  }

  return json({ ok: true });
});
