import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationRow = {
  id: string;
  attempt_count: number;
  donation_pledge_id: string;
  responsible_id: string;
  donation_pledges: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    items: string;
    quantity_note: string | null;
    planned_date: string | null;
    created_at: string;
  } | null;
  donation_responsibles: {
    id: string;
    name: string;
    phone: string;
    is_active: boolean;
    whatsapp_opt_in: boolean;
  } | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function formatDate(date: string | null) {
  if (!date) return "nao informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function buildMessage(notification: NotificationRow) {
  const donation = notification.donation_pledges;
  const responsible = notification.donation_responsibles;

  if (!donation || !responsible) {
    throw new Error("Registro de doacao ou responsavel nao encontrado.");
  }

  return [
    `Ola, ${responsible.name}.`,
    "",
    "Foi registrada uma nova doacao para coleta.",
    "",
    `Doador: ${donation.name}`,
    `Telefone: ${donation.phone}`,
    donation.email ? `Email: ${donation.email}` : null,
    `Itens: ${donation.items}`,
    donation.quantity_note ? `Quantidade: ${donation.quantity_note}` : null,
    `Data prevista: ${formatDate(donation.planned_date)}`,
    "",
    "Por favor, entre em contato para alinhar a retirada.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function updateNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  notificationId: string,
  values: Record<string, unknown>,
) {
  await supabaseAdmin.from("donation_notifications").update(values).eq("id", notificationId);
}

async function markFailure(
  supabaseAdmin: ReturnType<typeof createClient>,
  notification: NotificationRow,
  errorMessage: string,
) {
  await updateNotification(supabaseAdmin, notification.id, {
    status: "failed",
    error_message: errorMessage,
    attempt_count: notification.attempt_count + 1,
    last_attempt_at: new Date().toISOString(),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bridgeUrl = Deno.env.get("WHATSAPP_BRIDGE_URL");
  const bridgeToken = Deno.env.get("WHATSAPP_BRIDGE_TOKEN");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase environment is not configured." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.json().catch(() => ({}));
  const donationId = typeof body.donationId === "string" ? body.donationId : null;
  const notificationId = typeof body.notificationId === "string" ? body.notificationId : null;
  const retryFailed = body.retryFailed === true;

  if (!donationId && !notificationId) {
    return json({ error: "donationId or notificationId is required." }, 400);
  }

  let query = supabaseAdmin
    .from("donation_notifications")
    .select(`
      id,
      attempt_count,
      donation_pledge_id,
      responsible_id,
      donation_pledges (
        id,
        name,
        phone,
        email,
        items,
        quantity_note,
        planned_date,
        created_at
      ),
      donation_responsibles (
        id,
        name,
        phone,
        is_active,
        whatsapp_opt_in
      )
    `)
    .eq("channel", "whatsapp");

  if (donationId) {
    query = query.eq("donation_pledge_id", donationId);
  }

  if (notificationId) {
    query = query.eq("id", notificationId);
  }

  if (retryFailed) {
    query = query.in("status", ["pending", "failed"]);
  } else {
    query = query.eq("status", "pending");
  }

  const { data, error } = await query;

  if (error) {
    return json({ error: error.message }, 500);
  }

  const notifications = (data ?? []) as NotificationRow[];

  if (!bridgeUrl || !bridgeToken) {
    for (const notification of notifications) {
      await markFailure(
        supabaseAdmin,
        notification,
        "Configure WHATSAPP_BRIDGE_URL e WHATSAPP_BRIDGE_TOKEN nas secrets da Edge Function.",
      );
    }

    return json({
      processed: notifications.length,
      sent: 0,
      failed: notifications.length,
      error: "WhatsApp bridge environment variables are missing.",
    }, 500);
  }

  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const responsible = notification.donation_responsibles;

    if (!responsible?.is_active || !responsible.whatsapp_opt_in) {
      await markFailure(
        supabaseAdmin,
        notification,
        "Responsavel inativo ou sem permissao para receber avisos.",
      );
      failed += 1;
      continue;
    }

    const message = buildMessage(notification);
    const to = normalizePhone(responsible.phone);

    try {
      const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bridgeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, message }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        await markFailure(
          supabaseAdmin,
          notification,
          responseBody?.error ?? "Falha ao enviar mensagem pelo bridge do WhatsApp.",
        );
        failed += 1;
        continue;
      }

      await updateNotification(supabaseAdmin, notification.id, {
        status: "sent",
        message,
        provider_message_id: responseBody?.messageId ?? null,
        error_message: null,
        payload: { bridge: "whatsapp-web.js", response: responseBody },
        attempt_count: notification.attempt_count + 1,
        last_attempt_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      });

      sent += 1;
    } catch (bridgeError) {
      const messageText = bridgeError instanceof Error
        ? bridgeError.message
        : "Erro desconhecido ao chamar o bridge do WhatsApp.";

      await markFailure(supabaseAdmin, notification, messageText);
      failed += 1;
    }
  }

  return json({
    processed: notifications.length,
    sent,
    failed,
  });
});
