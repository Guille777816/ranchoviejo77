import { useState, useEffect } from "react";
import { Truck, MapPin, ExternalLink, Loader2, CheckCircle2, ShieldCheck, ChevronUp, PackageCheck } from "lucide-react";
import {
  calculateShippingQuote,
  type ShippingQuoteResult,
  type ShippingCarrier,
  type ShippingDimensions,
} from "@/lib/shipping";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShippingCalculatorProps {
  compact?: boolean;
  className?: string;
  dimensions?: Partial<ShippingDimensions>;
  quantity?: number;
  productPriceCents?: number;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ShippingCalculator({
  compact = false,
  className = "",
  dimensions,
  quantity = 1,
  productPriceCents,
}: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<"TODOS" | ShippingCarrier>("TODOS");

  // Recuperar CP previamente ingresado
  useEffect(() => {
    try {
      const savedCp = localStorage.getItem("rv_postal_code") || localStorage.getItem("fdm_postal_code");
      if (savedCp && !postalCode) {
        setPostalCode(savedCp);
      }
    } catch {}
  }, []);

  // Recalcular en vivo si cambia la cantidad o dimensiones y ya está cotizado
  useEffect(() => {
    if (result && postalCode) {
      const clean = postalCode.replace(/\D/g, "");
      if (clean.length >= 4) {
        const quote = calculateShippingQuote({
          postalCode: clean.slice(0, 4),
          dimensions,
          quantity,
          productPriceCents,
        });
        setResult(quote);
      }
    }
  }, [
    quantity,
    dimensions?.weightGrams,
    dimensions?.heightCm,
    dimensions?.widthCm,
    dimensions?.lengthCm,
    dimensions?.declaredValueCents,
    productPriceCents,
  ]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = postalCode.replace(/\D/g, "");

    if (!clean || clean.length < 4) {
      setError("Ingresá un código postal válido (4 dígitos)");
      setResult(null);
      setIsExpanded(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      localStorage.setItem("rv_postal_code", clean.slice(0, 4));
    } catch {}

    setTimeout(() => {
      const quote = calculateShippingQuote({
        postalCode: clean.slice(0, 4),
        dimensions,
        quantity,
        productPriceCents,
      });
      setResult(quote);
      setIsExpanded(true);
      setLoading(false);
    }, 220);
  };

  const handleClear = () => {
    setPostalCode("");
    setResult(null);
    setIsExpanded(false);
    setError(null);
    try {
      localStorage.removeItem("rv_postal_code");
    } catch {}
  };

  const filteredItems = result
    ? selectedCarrier === "TODOS"
      ? result.items
      : result.items.filter((item) => item.carrier === selectedCarrier)
    : [];

  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm text-neutral-900 transition-all ${className}`}>
      {/* Cuadrito compacto de Cotizar Envío */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200/80">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-neutral-900 truncate">
              Cotizar envío exacto
            </h4>
            <p className="text-[11px] text-neutral-500 truncate">
              Los 3 mejores correos: Correo Arg · Andreani · OCA
            </p>
          </div>
        </div>

        {/* Miniaturas de logos de transportes */}
        <div className="flex items-center gap-1.5 shrink-0 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200/80">
          <img
            src="/images/carriers/correo-argentino.png"
            alt="Correo Argentino"
            title="Correo Argentino"
            className="h-4 w-4 object-contain"
          />
          <img
            src="/images/carriers/andreani.png"
            alt="Andreani"
            title="Andreani"
            className="h-4 w-4 object-contain"
          />
          <img
            src="/images/carriers/oca.svg"
            alt="OCA"
            title="OCA Postal"
            className="h-4 w-4 object-contain"
          />
        </div>
      </div>

      {/* Formulario compacto: Input CP y Botón Cotizar */}
      <form onSubmit={handleCalculate} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="Tu código postal (ej: 2600, 1043...)"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              if (error) setError(null);
            }}
            className="h-9 text-xs sm:text-sm bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 font-medium focus-visible:ring-1 focus-visible:ring-neutral-900 pr-7"
          />
          {postalCode && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !postalCode.trim()}
          className="h-9 px-4 text-xs font-bold shrink-0 gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              <span>Calculando...</span>
            </>
          ) : (
            <span>Cotizar</span>
          )}
        </Button>
      </form>

      {/* Enlace sutil para buscar CP */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <a
          href="https://www.correoargentino.com.ar/formularios/cpa"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-900 hover:underline inline-flex items-center gap-1 text-[11px]"
        >
          <span>¿No sabés tu código postal?</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>

        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="font-medium text-neutral-600 hover:text-neutral-900 hover:underline inline-flex items-center gap-1"
          >
            <span>Ocultar opciones</span>
            <ChevronUp className="h-3 w-3" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      )}

      {/* ============================================================== */}
      {/* RESULTADO COMPARATIVO DE LOS 3 CORREOS                         */}
      {/* ============================================================== */}
      {isExpanded && result && (
        <div className="mt-3.5 space-y-2.5 border-t border-neutral-200 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cabecera del destino */}
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
              <span className="truncate">Destino: <strong>{result.location}</strong></span>
            </span>
            <span className="text-[11px] text-neutral-500 font-medium shrink-0">CP {result.postalCode}</span>
          </div>

          {/* Resumen dinámico del bulto cotizado */}
          {result.packageDetails && (
            <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-neutral-600 bg-neutral-100/80 px-2.5 py-1.5 rounded-lg border border-neutral-200/70">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="h-3.5 w-3.5 text-neutral-700" />
                <span>
                  Cotizado para: <strong>{result.packageDetails.quantity} {result.packageDetails.quantity === 1 ? "unidad" : "unidades"}</strong> · <strong>{result.packageDetails.billableWeightKg} kg facturable</strong> ({result.packageDetails.totalWeightKg} kg físico)
                </span>
              </span>
              {result.packageDetails.declaredValue > 0 && (
                <span className="text-neutral-500 font-medium">
                  Seguro: ${result.packageDetails.declaredValue.toLocaleString("es-AR")}
                </span>
              )}
            </div>
          )}

          {/* Filtros rápidos por correo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedCarrier("TODOS")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                selectedCarrier === "TODOS"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Todos ({result.items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("Correo Argentino")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                selectedCarrier === "Correo Argentino"
                  ? "bg-[#FFCC00] text-neutral-900 font-bold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/correo-argentino.png" alt="" className="h-3 w-3 object-contain" />
              Correo Argentino
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("Andreani")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                selectedCarrier === "Andreani"
                  ? "bg-[#E30613] text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/andreani.png" alt="" className="h-3 w-3 object-contain" />
              Andreani
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("OCA")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                selectedCarrier === "OCA"
                  ? "bg-[#6A1B9A] text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/oca.svg" alt="" className="h-3 w-3 object-contain" />
              OCA
            </button>
          </div>

          {/* Tarjetas individuales de opciones */}
          <div className="space-y-1.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0 p-1 rounded-md bg-neutral-50 border border-neutral-100">
                    <img
                      src={item.logoUrl}
                      alt={item.carrier}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-neutral-900">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.badgeColor === "green"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                              : item.badgeColor === "blue"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-600 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{item.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-neutral-900">
                    {formatMoney(item.price)}
                  </div>
                  <div className="text-[9px] text-neutral-400">precio justo final</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 bg-neutral-50 border border-neutral-200/80 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              Tarifas sincronizadas para Correo Argentino, Andreani y OCA. Incluye seguimiento oficial y seguro de mercadería.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
