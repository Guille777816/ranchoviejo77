import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const searchSchema = z.object({
  status: z.enum(["success", "pending", "failure"]).optional(),
});

export const Route = createFileRoute("/pedido/$id")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Tu pedido — Rancho Viejo Mates" }] }),
  component: PedidoPage,
});

function PedidoPage() {
  const { id } = Route.useParams();
  const { status } = Route.useSearch();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_public", { _order_id: id });
      if (error) throw error;
      return (data as {
        id: string;
        status: string;
        customer_name: string;
        total_cents: number;
        subtotal_cents: number;
        shipping_cents: number;
        created_at: string;
        order_items: { product_name: string; quantity: number; unit_price_cents: number }[];
      } | null) ?? null;
    },
  });

  const banner = (() => {
    if (status === "success" || order?.status === "paid")
      return {
        icon: CheckCircle2,
        title: "¡Pago aprobado!",
        text: "Tu pedido fue confirmado. Te enviamos los datos por email.",
        tone: "text-green-600",
      };
    if (status === "failure")
      return {
        icon: XCircle,
        title: "El pago no se completó",
        text: "Podés reintentar el pago o contactarnos.",
        tone: "text-destructive",
      };
    return {
      icon: Clock,
      title: "Pedido recibido",
      text: "Estamos esperando la confirmación del pago.",
      tone: "text-muted-foreground",
    };
  })();
  const Icon = banner.icon;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border bg-card p-6 text-center">
          <Icon className={`mx-auto h-12 w-12 ${banner.tone}`} />
          <h1 className="mt-3 text-2xl font-bold">{banner.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{banner.text}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Pedido #{id.slice(0, 8)}
          </p>
        </div>

        {order && (
          <div className="mt-6 rounded-lg border bg-card p-6">
            <h2 className="font-semibold">Detalle</h2>
            <ul className="mt-3 divide-y text-sm">
              {order.order_items?.map((it, idx) => (
                <li key={idx} className="flex justify-between py-2">
                  <span>
                    {it.quantity}× {it.product_name}
                  </span>
                  <span>{formatPrice(it.unit_price_cents * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button asChild variant="secondary">
            <Link to="/tienda">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
