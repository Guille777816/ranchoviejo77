import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  variant: z.string().max(160).optional().nullable(),
});

const inputSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  customer_name: z.string().min(1).max(120),
  customer_email: z.string().email().max(160),
  customer_phone: z.string().max(40).optional().nullable(),
  customer_dni: z.string().trim().min(6, "DNI inválido").max(20),
  shipping_address: z.string().max(200).optional().nullable(),
  shipping_city: z.string().max(80).optional().nullable(),
  shipping_province: z.string().max(80).optional().nullable(),
  shipping_zip: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

function getPublicClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta configuración del backend. En Vercel cargá SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
    if (!mpToken) {
      throw new Error(
        "MercadoPago no está configurado. Agregá MERCADOPAGO_ACCESS_TOKEN en Vercel → Environment Variables.",
      );
    }
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        "Falta WEBHOOK_SECRET en Vercel → Environment Variables. Pedile a Lovable el valor exacto.",
      );
    }

    const supabase = getPublicClient();

    const { data: newOrderId, error: rpcErr } = await supabase.rpc(
      "create_order_public",
      {
        _items: data.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant ?? null,
        })),
        _customer: {
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone ?? null,
          customer_dni: data.customer_dni,
          shipping_address: data.shipping_address ?? null,
          shipping_city: data.shipping_city ?? null,
          shipping_province: data.shipping_province ?? null,
          shipping_zip: data.shipping_zip ?? null,
          notes: data.notes ?? null,
        },
        _user_id: undefined,
      },
    );
    if (rpcErr || !newOrderId) {
      throw new Error(rpcErr?.message ?? "No se pudo crear el pedido");
    }
    const orderId = newOrderId as unknown as string;

    const order = {
      id: orderId,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
    };

    // Build MP items directly from validated input + products (avoid anon read of orders)
    const ids = data.items.map((i) => i.productId);
    const { data: prods, error: prodsErr } = await supabase
      .from("products")
      .select("id, name, price_cents")
      .in("id", ids);
    if (prodsErr) console.warn("products read error", prodsErr);
    const byId = new Map((prods ?? []).map((p) => [p.id, p]));
    const mpItems = data.items
      .map((i) => {
        const p = byId.get(i.productId);
        if (!p) return null;
        return {
          title: p.name,
          quantity: i.quantity,
          unit_price: Math.round(p.price_cents) / 100,
          currency_id: "ARS",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (mpItems.length === 0) {
      throw new Error("No se pudieron leer los items del pedido para MercadoPago");
    }

    let origin = (process.env.SITE_URL || "").replace(/\/$/, "");
    try {
      const req = getRequest();
      const hdrOrigin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      const host = req.headers.get("host");
      const proto = req.headers.get("x-forwarded-proto") || "https";
      if (hdrOrigin) origin = hdrOrigin.replace(/\/$/, "");
      else if (referer) origin = new URL(referer).origin;
      else if (host) origin = `${proto}://${host}`;
    } catch {}
    if (!origin) origin = "https://www.ranchoviejo.com.ar";
    const body = {
      items: mpItems,
      payer: { name: order.customer_name, email: order.customer_email },
      external_reference: order.id,
      payment_methods: {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "ticket" },
        ],
      },
      back_urls: {
        success: `${origin}/pedido/${order.id}?status=success`,
        failure: `${origin}/pedido/${order.id}?status=failure`,
        pending: `${origin}/pedido/${order.id}?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mp-webhook`,
    };

    let init_point: string | null = null;
    let preference_id: string | null = null;
    try {
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        id?: string;
        init_point?: string;
        sandbox_init_point?: string;
        message?: string;
        error?: string;
      };
      if (res.ok && json.id) {
        preference_id = json.id;
        init_point = json.init_point || json.sandbox_init_point || null;
        await supabase.rpc("set_order_mp_preference", {
          _order_id: order.id,
          _preference_id: preference_id,
          _secret: webhookSecret,
        });
      } else {
        console.error("MP preference error", json);
        throw new Error(json.message || json.error || "MercadoPago rechazó el link de pago");
      }
    } catch (e) {
      console.error("MP request failed", e);
      if (e instanceof Error) throw e;
      throw new Error("No se pudo conectar con MercadoPago");
    }

    // Fire-and-forget: send order confirmation email to the customer.
    // Never let email errors break the checkout.
    try {
      const { sendOrderConfirmationEmail } = await import(
        "@/lib/email/send-order-confirmation.server"
      );
      const totalCents = data.items.reduce((sum, i) => {
        const p = byId.get(i.productId);
        return sum + (p ? p.price_cents * i.quantity : 0);
      }, 0);
      const emailItems = data.items
        .map((i) => {
          const p = byId.get(i.productId);
          if (!p) return null;
          return {
            name: i.variant ? `${p.name} — ${i.variant}` : p.name,
            quantity: i.quantity,
            unit_price_cents: p.price_cents,
          };
        })
        .filter((x): x is { name: string; quantity: number; unit_price_cents: number } => !!x);

      let contactPhone: string | null = null;
      let contactEmail: string | null = null;
      try {
        const { data: settings } = await supabase
          .from("site_settings")
          .select("contact_email, whatsapp_phone")
          .limit(1)
          .maybeSingle();
        contactEmail = (settings as any)?.contact_email ?? null;
        contactPhone = (settings as any)?.whatsapp_phone ?? null;
      } catch {}

      const emailPayload = {
        orderId: order.id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        items: emailItems,
        totalCents,
        shippingAddress: data.shipping_address ?? null,
        shippingCity: data.shipping_city ?? null,
        shippingProvince: data.shipping_province ?? null,
        shippingZip: data.shipping_zip ?? null,
        contactPhone,
        contactEmail,
      };

      await sendOrderConfirmationEmail(supabase, emailPayload);

      // Copia interna para la tienda
      const ownerEmail = contactEmail ?? "hola@ranchoviejo.com.ar";
      if (ownerEmail && ownerEmail !== data.customer_email) {
        await sendOrderConfirmationEmail(supabase, emailPayload, {
          deliverTo: ownerEmail,
          keySuffix: "-owner",
          subjectPrefix: "[Venta nueva] ",
        });
      }

    } catch (emailErr) {
      console.error("Order confirmation email failed", emailErr);
    }

    return { orderId: order.id, init_point, preference_id };
  });
