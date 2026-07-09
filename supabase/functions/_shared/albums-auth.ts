import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export async function requirePermission(req: Request, permission: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey) return { ok: false as const, status: 500, error: "Configuracao do Supabase ausente." };
  if (!authorization) return { ok: false as const, status: 401, error: "Sessao obrigatoria." };

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return { ok: false as const, status: 401, error: "Sessao invalida." };

  const { data, error } = await client.rpc("get_my_admin_access");
  if (error) return { ok: false as const, status: 500, error: error.message };

  const access = data as { is_master?: boolean; permissions?: string[] } | null;
  const allowed = Boolean(access?.is_master || access?.permissions?.includes(permission));
  if (!allowed) return { ok: false as const, status: 403, error: "Permissao insuficiente." };

  return { ok: true as const, userId: userData.user.id };
}
