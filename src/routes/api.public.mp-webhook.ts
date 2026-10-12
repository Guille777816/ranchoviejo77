import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// MercadoPago webhook. Uses the publishable key + a signed RPC (webhook_secret)
// so it works on any host (Vercel, Lovable, etc.) without service-role key.
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
  let topic = url.searchParams.get("topic") || url.searchParams.get("type");

  if (request.method === "POST") {
    try {
      const body = await request.clone().json();
      paymentId = body?.data?.id?.toString() || paymentId;
      topic = body?.type || topic;
    } catch {}
  }

  if (!paymentId || (topic && topic !== "payment")) {
    return new Response("ok", { status: 200 });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!token || !supabaseUrl || !supabaseKey || !webhookSecret) {
    console.error("MP webhook missing env vars");
    return new Response("ok", { status: 200 });
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return new Response("ok", { status: 200 });
    const payment = (await res.json()) as {
      id: number;
      status: string;
      external_reference?: string;
    };
    const orderId = payment.external_reference;
    if (!orderId) return new Response("ok", { status: 200 });

    const newStatus =
      payment.status === "approved"
        ? "paid"
        : payment.status === "cancelled" || payment.status === "rejected"
          ? "cancelled"
          : "pending";

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    await supabase.rpc("apply_mp_payment", {
      _order_id: orderId,
      _status: newStatus,
      _payment_id: String(payment.id),
      _secret: webhookSecret,
    });
  } catch (e) {
    console.error("MP webhook error", e);
  }

  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
