import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/components/ProductCard";
import {
  ShoppingBag,
  Sparkles,
  X,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Minimize2,
} from "lucide-react";

const MIN_PURCHASE_CENTS = 10_000_000; // $100.000 ARS

export function MinimumPurchaseBubble() {
  const { subtotalCents, count } = useCart();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("rv_min_bubble_state");
    if (stored === "minimized") {
      setIsMinimized(true);
    } else if (stored === "dismissed") {
      setIsDismissed(true);
    }
  }, []);

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
    sessionStorage.setItem("rv_min_bubble_state", "minimized");
  };

  const handleExpand = () => {
    setIsMinimized(false);
    setIsDismissed(false);
    sessionStorage.setItem("rv_min_bubble_state", "expanded");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem("rv_min_bubble_state", "dismissed");
  };

  if (!mounted || isDismissed) {
    // If dismissed, render a discreet small badge pill so user can still restore it if they want
    return (
      <div className="fixed bottom-4 left-4 z-40 hidden sm:block">
        <button
          onClick={handleExpand}
          className="group flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-all hover:border-primary hover:bg-card hover:scale-105"
          title="Ver condiciones de compra mínima"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          <span>Compra mínima: $ 100.000</span>
        </button>
      </div>
    );
  }

  const reachedMin = subtotalCents >= MIN_PURCHASE_CENTS;
  const progressPercent = Math.min(
    100,
    Math.round((subtotalCents / MIN_PURCHASE_CENTS) * 100)
  );
  const remainingCents = Math.max(0, MIN_PURCHASE_CENTS - subtotalCents);

  // Minimized bubble state
  if (isMinimized) {
    return (
      <aside
        aria-label="Aviso de compra mínima"
        className="fixed bottom-20 left-4 z-40 sm:bottom-6 sm:left-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      >
        <button
          onClick={handleExpand}
          className="group flex items-center gap-2.5 rounded-full border border-primary/40 bg-card/95 px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.5),0_0_15px_rgba(45,212,191,0.2)] backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-primary"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
            {reachedMin ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${reachedMin ? "bg-emerald-400" : "bg-primary"}`}></span>
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${reachedMin ? "bg-emerald-400" : "bg-primary"}`}></span>
            </span>
          </div>

          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Venta Mayorista
            </p>
            <p className="text-xs font-bold text-foreground">
              {reachedMin ? "¡Mínimo alcanzado!" : "Mínimo: $ 100.000"}
            </p>
          </div>

          <span className="ml-1 text-xs text-muted-foreground transition-transform group-hover:translate-x-0.5">
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </aside>
    );
  }

  // Full expanded bubble card
  return (
    <aside
      aria-label="Aviso de compra mínima mayorista"
      className="fixed bottom-20 left-3 right-3 sm:right-auto sm:left-6 sm:bottom-6 z-40 max-w-sm w-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),0_0_25px_rgba(45,212,191,0.18)] backdrop-blur-xl">
        {/* Subtle ambient gradient flare */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

        {/* Top bar: Badge & controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
            </span>
            Venta Mayorista Directa
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              onClick={handleMinimize}
              className="rounded-lg p-1 transition-colors hover:bg-accent hover:text-foreground"
              title="Minimizar burbuja"
              aria-label="Minimizar"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1 transition-colors hover:bg-accent hover:text-foreground"
              title="Cerrar aviso"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main headline */}
        <div className="mt-2.5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold leading-tight text-foreground">
              Compra mínima:{" "}
              <span className="text-primary drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]">
                $ 100.000
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Precios por mayor en mates, bombillas y accesorios. Podés surtir productos libremente.
            </p>
          </div>
        </div>

        {/* Dynamic Cart Progress Section */}
        {count > 0 ? (
          <div className="mt-3 rounded-xl border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                Tu carrito:
              </span>
              <span className="font-semibold text-foreground">
                {formatPrice(subtotalCents)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  reachedMin
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    : "bg-primary shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              {reachedMin ? (
                <span className="flex items-center gap-1 font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  ¡Mínimo alcanzado! Listo para comprar
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="h-3 w-3 text-primary" />
                  Te faltan:{" "}
                  <strong className="text-foreground">
                    {formatPrice(remainingCents)}
                  </strong>
                </span>
              )}
              <span className="font-medium text-muted-foreground">
                {progressPercent}%
              </span>
            </div>
          </div>
        ) : null}

        {/* Action Button */}
        <div className="mt-3 flex items-center gap-2">
          {count > 0 ? (
            <Link
              to="/carrito"
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-md transition-all ${
                reachedMin
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              <span>Ver carrito ({count})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/tienda"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              <span>Ver catálogo mayorista</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            onClick={handleMinimize}
            className="rounded-xl border border-border/80 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Entendido
          </button>
        </div>
      </div>
    </aside>
  );
}
