import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart, itemKey } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rancho Viejo Mates" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: user?.email ?? "",
    customer_phone: "",
    customer_dni: "",
    shipping_address: "",
    shipping_city: "",
    shipping_province: "",
    shipping_zip: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedCp = localStorage.getItem("rv_postal_code") || localStorage.getItem("fdm_postal_code");
      if (savedCp && !form.shipping_zip) {
        setForm((prev) => ({ ...prev, shipping_zip: savedCp }));
      }
    } catch {}
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
          <Button asChild className="mt-4">
            <Link to="/tienda">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (subtotalCents < 10_000_000) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-lg">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Compra mínima requerida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para realizar pedidos mayoristas en Rancho Viejo, la compra mínima es de <strong className="text-foreground">$ 100.000</strong>.
          </p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-card p-5 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal actual:</span>
              <span className="font-semibold text-foreground">{formatPrice(subtotalCents)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-primary font-semibold">
              <span>Te faltan:</span>
              <span>{formatPrice(10_000_000 - subtotalCents)}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/carrito">Volver al carrito</Link>
            </Button>
            <Button asChild>
              <Link to="/tienda">Sumar más productos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotalCents < 10_000_000) {
      toast.error("La compra mínima mayorista es de $ 100.000");
      return;
    }
    if (!form.customer_name || !form.customer_email) {
      toast.error("Completá nombre y email");
      return;
    }
    if (form.customer_dni.trim().length < 6) {
      toast.error("Ingresá un DNI válido (lo pide el correo para el envío)");
      return;
    }
    setLoading(true);
    try {
      const result = await createOrderFn({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variant: i.variant ?? null,
          })),
          ...form,
          notes: [
            form.notes?.trim(),
            items.some((i) => i.variant)
              ? "Modelos elegidos: " +
                items
                  .filter((i) => i.variant)
                  .map((i) => `${i.quantity}× ${i.name} — ${i.variant}`)
                  .join(" | ")
              : null,
          ]
            .filter(Boolean)
            .join(" — ")
            .slice(0, 500),
        },
      });
      clear();
      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        navigate({ to: "/pedido/$id", params: { id: result.orderId } });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear el pedido";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold md:text-3xl">Finalizar compra</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]"
        >
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Datos de contacto y envío</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer_name">Nombre completo *</Label>
                <Input
                  id="customer_name"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  required
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Teléfono / WhatsApp</Label>
                <Input
                  id="customer_phone"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_dni">DNI / Documento *</Label>
                <Input
                  id="customer_dni"
                  required
                  inputMode="numeric"
                  placeholder="Ej: 30123456"
                  value={form.customer_dni}
                  onChange={(e) => setForm({ ...form, customer_dni: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Lo necesitamos para despachar el envío por correo.
                </p>
              </div>
              <div>
                <Label htmlFor="shipping_zip">Código postal</Label>
                <Input
                  id="shipping_zip"
                  value={form.shipping_zip}
                  onChange={(e) => setForm({ ...form, shipping_zip: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="shipping_address">Dirección</Label>
                <Input
                  id="shipping_address"
                  placeholder="Calle, número, piso/dpto"
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="shipping_city">Ciudad</Label>
                <Input
                  id="shipping_city"
                  value={form.shipping_city}
                  onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="shipping_province">Provincia</Label>
                <Input
                  id="shipping_province"
                  value={form.shipping_province}
                  onChange={(e) => setForm({ ...form, shipping_province: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Tu pedido</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={itemKey(i)} className="flex justify-between gap-2">
                  <span className="line-clamp-2">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="shrink-0">
                    {formatPrice(i.price_cents * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <Button type="submit" className="mt-4 w-full" size="lg" disabled={loading}>
              {loading ? "Procesando..." : "Pagar con MercadoPago"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Aceptamos tarjeta de débito, transferencia bancaria y dinero en cuenta MercadoPago.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
