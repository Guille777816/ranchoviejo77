import { useState, useEffect } from "react";
import { Truck, MapPin, Building2, ExternalLink, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { calculateShippingQuote, type ShippingQuoteResult } from "@/lib/shipping";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShippingCalculatorProps {
  compact?: boolean;
  className?: string;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ShippingCalculator({ compact = false, className = "" }: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Leer código postal guardado previamente
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rv_postal_code") || localStorage.getItem("fdm_postal_code");
      if (saved && saved.length >= 4) {
        setPostalCode(saved);
        const quote = calculateShippingQuote(saved);
        setResult(quote);
      }
    } catch {}
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = postalCode.replace(/\D/g, "");

    if (!clean || clean.length < 4) {
      setError("Ingresá un código postal válido (4 dígitos)");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      localStorage.setItem("rv_postal_code", clean.slice(0, 4));
    } catch {}

    setTimeout(() => {
      const quote = calculateShippingQuote(clean.slice(0, 4));
      setResult(quote);
      setLoading(false);
    }, 280);
  };

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              Medios de envío y entrega
              <span className="inline-flex items-center rounded-md bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-800 dark:text-yellow-300">
                Correo Argentino
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculá el costo y tiempo de despacho a todo el país:
            </p>
          </div>
        </div>
      </div>

      {/* Input y botón calcular */}
      <form onSubmit={handleCalculate} className="mt-3.5 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="Tu código postal (ej: 1428, 5000...)"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              if (error) setError(null);
            }}
            className="h-10 text-sm bg-background pr-8 font-medium"
          />
          {postalCode && (
            <button
              type="button"
              onClick={() => {
                setPostalCode("");
                setResult(null);
                try {
                  localStorage.removeItem("rv_postal_code");
                } catch {}
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !postalCode.trim()}
          className="h-10 px-5 font-semibold shrink-0 gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            "Calcular costo"
          )}
        </Button>
      </form>

      {/* Enlace de ayuda si no sabe el CP */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <a
          href="https://www.correoargentino.com.ar/formularios/cpa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors hover:underline text-[11px]"
        >
          <span>¿No sabés tu código postal? Buscalo en Correo Argentino</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      )}

      {/* Resultados de Cotización */}
      {result && (
        <div className="mt-4 space-y-2.5 border-t border-border/70 pt-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Envíos a <strong>{result.location}</strong></span>
            </span>
            <span className="text-[11px] text-muted-foreground">CP {result.postalCode}</span>
          </div>

          <div className="space-y-2">
            {result.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-background/80 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0 text-primary">
                    {item.type === "domicilio" ? (
                      <Truck className="h-4 w-4 text-primary" />
                    ) : (
                      <Building2 className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {item.title}
                      </p>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            item.badge === "Más rápido"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ✓ {item.estimatedTime}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-foreground">
                    {item.price === 0 ? "¡Gratis!" : formatMoney(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Garantía y aviso de embalaje */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              Todos los pedidos de Rancho Viejo incluyen <strong>código de seguimiento oficial</strong> por Correo Argentino y embalaje especial para proteger mates y accesorios.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
