import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart, itemKey } from "@/lib/cart";
import { formatPrice } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/carrito")({
  head: () => ({ meta: [{ title: "Carrito — Rancho Viejo Mates" }] }),
  component: CarritoPage,
});

function CarritoPage() {
  const { items, setQty, remove, subtotalCents, clear } = useCart();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold md:text-3xl">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed bg-card p-10 text-center">
            <p className="text-muted-foreground">Tu carrito está vacío.</p>
            <Button asChild className="mt-4">
              <Link to="/tienda">Ir a la tienda</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={itemKey(i)}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/producto/$slug"
                      params={{ slug: i.slug }}
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {i.name}
                    </Link>
                    {i.variant && (
                      <p className="text-xs text-primary">Modelo: {i.variant}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(i.price_cents)} c/u
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setQty(itemKey(i), i.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setQty(itemKey(i), i.quantity + 1)}
                        disabled={i.quantity >= i.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-semibold">
                      {formatPrice(i.price_cents * i.quantity)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(itemKey(i))}
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              <li className="text-right">
                <Button variant="ghost" size="sm" onClick={clear}>
                  Vaciar carrito
                </Button>
              </li>
            </ul>

            <aside className="h-fit rounded-lg border bg-card p-4">
              <h2 className="font-semibold">Resumen</h2>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">A calcular</span>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <Button asChild className="mt-4 w-full" size="lg">
                <Link to="/checkout">Finalizar compra</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
