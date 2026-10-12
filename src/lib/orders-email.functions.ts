import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email().max(160).optional().nullable(),
});

export const resendOrderConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) throw new Error("Solo administradores pueden reenviar emails");

    if (data.email) {
      const { error: updErr } = await supabase.rpc("admin_update_order_email", {
        _order_id: data.orderId,
        _email: data.email,
      });
      if (updErr) throw new Error(updErr.message);
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_email, total_cents, shipping_address, shipping_city, shipping_province, shipping_zip, order_items(product_name, quantity, unit_price_cents)",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Pedido no encontrado");

    const { data: settings } = await supabase
      .from("site_settings")
      .select("contact_email, whatsapp_phone")
      .limit(1)
      .maybeSingle();

    const { sendOrderConfirmationEmail } = await import(
      "@/lib/email/send-order-confirmation.server"
    );

    const result = await sendOrderConfirmationEmail(
      supabase,
      {
        orderId: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: (order.order_items ?? []).map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          unit_price_cents: it.unit_price_cents,
        })),
        totalCents: order.total_cents,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        shippingProvince: order.shipping_province,
        shippingZip: order.shipping_zip,
        contactPhone: settings?.whatsapp_phone ?? null,
        contactEmail: settings?.contact_email ?? null,
      },
      { keySuffix: `-resend-${Date.now()}` },
    );

    if (!result.ok) throw new Error("No se pudo encolar el email");
    return { ok: true as const, email: order.customer_email };
  });
