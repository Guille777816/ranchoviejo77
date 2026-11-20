import { useState, useEffect } from "react";
import { Truck, MapPin, Building2, ExternalLink, Loader2, CheckCircle2, ShieldCheck, Search, ChevronDown, ChevronUp } from "lucide-react";
import { calculateShippingQuote, type ShippingQuoteResult, type ShippingCarrier } from "@/lib/shipping";
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

interface ViaCargoAgency {
  name: string;
  address: string;
  city: string;
  province: string;
  phone?: string;
  hours?: string;
}

export function ShippingCalculator({ compact = false, className = "" }: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<"TODOS" | ShippingCarrier>("TODOS");

  // Buscador de agencias Vía Cargo
  const [showAgencies, setShowAgencies] = useState(false);
  const [agencies, setAgencies] = useState<ViaCargoAgency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [agencySearch, setAgencySearch] = useState("");

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
    }, 250);
  };

  const handleLoadAgencies = async () => {
    if (agencies.length > 0) {
      setShowAgencies(!showAgencies);
      return;
    }

    setLoadingAgencies(true);
    setShowAgencies(true);
    try {
      const res = await fetch("/data/viacargo-agencias.json");
      if (res.ok) {
        const data = await res.json();
        setAgencies(data);
      }
    } catch (err) {
      console.error("Error loading Via Cargo agencies:", err);
    } finally {
      setLoadingAgencies(false);
    }
  };

  const filteredItems = result
    ? selectedCarrier === "TODOS"
      ? result.items
      : result.items.filter((item) => item.carrier === selectedCarrier)
    : [];

  const filteredAgencies = agencies.filter((a) => {
    if (!agencySearch) return true;
    const q = agencySearch.toLowerCase();
    return (
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.province.toLowerCase().includes(q) ||
      a.address.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm text-neutral-900 transition-all ${className}`}>
      {/* Encabezado con los 3 logos oficiales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200/80">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-2">
              Medios de envío y transporte
            </h3>
            <p className="text-xs text-neutral-500">
              Despachamos por Andreani, Correo Argentino y Vía Cargo a todo el país:
            </p>
          </div>
        </div>

        {/* Logos de los 3 transportes */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
          <img
            src="/images/carriers/andreani.png"
            alt="Andreani"
            title="Andreani Oficial"
            className="h-6 w-6 object-contain"
          />
          <img
            src="/images/carriers/correo-argentino.png"
            alt="Correo Argentino"
            title="Correo Argentino Oficial"
            className="h-6 w-6 object-contain"
          />
          <img
            src="/images/carriers/viacargo.png"
            alt="Vía Cargo"
            title="Vía Cargo Oficial"
            className="h-5 w-12 object-contain"
          />
        </div>
      </div>

      {/* Input y botón calcular */}
      <form onSubmit={handleCalculate} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="Ingresá tu código postal (ej: 1043, 2000, 5000...)"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              if (error) setError(null);
            }}
            className="h-10 text-sm bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 font-medium focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 pr-8"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !postalCode.trim()}
          className="h-10 px-5 font-semibold shrink-0 gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Calculando...
            </>
          ) : (
            "Calcular costo"
          )}
        </Button>
      </form>

      {/* Enlaces de ayuda */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <a
          href="https://www.correoargentino.com.ar/formularios/cpa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors hover:underline text-[11px]"
        >
          <span>¿No sabés tu código postal? Buscalo en Correo Argentino</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        <button
          type="button"
          onClick={handleLoadAgencies}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 hover:underline"
        >
          <span>Ver agencias Vía Cargo</span>
          {showAgencies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Desplegable de Agencias Vía Cargo */}
      {showAgencies && (
        <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <img src="/images/carriers/viacargo.png" alt="Vía Cargo" className="h-3.5 w-auto" />
              Agencias y terminales Vía Cargo en Argentina
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">1.127 agencias</span>
          </div>

          <div className="relative mb-2">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscá por ciudad o provincia (ej: Rosario, Córdoba, Mendoza...)"
              value={agencySearch}
              onChange={(e) => setAgencySearch(e.target.value)}
              className="h-8 text-xs pl-8 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
            />
          </div>

          {loadingAgencies ? (
            <div className="py-4 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando agencias oficiales...
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredAgencies.map((agency, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 text-[11px]">{agency.name}</span>
                    <span className="text-[10px] text-neutral-500 font-medium">{agency.city}, {agency.province}</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{agency.address}</p>
                  {agency.phone && (
                    <p className="text-[9px] text-neutral-500 mt-0.5">📞 {agency.phone}</p>
                  )}
                </div>
              ))}
              {filteredAgencies.length === 0 && (
                <p className="text-center text-[11px] text-neutral-500 py-2">
                  No se encontraron agencias con esa búsqueda.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2.5 text-xs font-semibold text-red-600">{error}</p>
      )}

      {/* Resultados de Cotización */}
      {result && (
        <div className="mt-4 space-y-2.5 border-t border-neutral-200 pt-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 bg-neutral-100/90 border border-neutral-200 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
              <span>Envíos a <strong>{result.location}</strong></span>
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">CP {result.postalCode}</span>
          </div>

          {/* Filtros por transporte */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedCarrier("TODOS")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCarrier === "TODOS"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Todos ({result.items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("Andreani")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCarrier === "Andreani"
                  ? "bg-[#E30613] text-white font-semibold shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/andreani.png" alt="" className="h-3.5 w-3.5 object-contain" />
              Andreani
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("Correo Argentino")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCarrier === "Correo Argentino"
                  ? "bg-[#FFCC00] text-neutral-900 font-bold shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/correo-argentino.png" alt="" className="h-3.5 w-3.5 object-contain" />
              Correo Argentino
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarrier("Vía Cargo")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCarrier === "Vía Cargo"
                  ? "bg-[#008A3B] text-white font-semibold shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <img src="/images/carriers/viacargo.png" alt="" className="h-3 w-8 object-contain" />
              Vía Cargo
            </button>
          </div>

          {/* Lista de opciones de envío cotizadas */}
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 p-1 rounded-lg bg-neutral-50 border border-neutral-100">
                    <img
                      src={item.logoUrl}
                      alt={item.carrier}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.badgeColor === "blue"
                              ? "bg-red-50 text-red-700 border border-red-200/60"
                              : item.badgeColor === "emerald"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                              : "bg-amber-50 text-amber-800 border border-amber-200/60"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{item.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-extrabold text-neutral-900">
                    {formatMoney(item.price)}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-medium">precio final</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-600 bg-neutral-50 border border-neutral-200/80 px-3.5 py-2.5 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Todos los pedidos de Rancho Viejo incluyen <strong>código de seguimiento oficial</strong> y embalaje especial para proteger mates, bombillas y accesorios.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
