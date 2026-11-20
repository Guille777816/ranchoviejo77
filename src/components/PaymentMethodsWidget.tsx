import React, { useState } from "react";
import { ShieldCheck, CreditCard, ChevronDown, ChevronUp, Sparkles, Building2, Smartphone } from "lucide-react";

interface PaymentMethodsWidgetProps {
  price?: number;
  className?: string;
  compact?: boolean;
  showTransferBadge?: boolean;
}

const PAYMENT_METHODS = [
  { key: "visa", label: "Visa", src: "/images/payment-methods/visa.png" },
  { key: "mastercard", label: "Mastercard", src: "/images/payment-methods/mastercard.png" },
  { key: "american", label: "American Express", src: "/images/payment-methods/american.png" },
  { key: "mercadopago", label: "Mercado Pago", src: "/images/payment-methods/mercadopago.png" },
  { key: "modo", label: "MODO", src: "/images/payment-methods/modo.png" },
  { key: "naranja", label: "Naranja X", src: "/images/payment-methods/naranja.png" },
  { key: "cabal", label: "Cabal", src: "/images/payment-methods/cabal.png" },
  { key: "uala", label: "Ualá", src: "/images/payment-methods/uala.png" },
  { key: "gocuotas", label: "Go Cuotas", src: "/images/payment-methods/gocuotas.png" },
  { key: "rapipago", label: "Rapipago", src: "/images/payment-methods/rapipago.png" },
  { key: "pagofacil", label: "Pago Fácil", src: "/images/payment-methods/pagofacil.png" },
];

export function PaymentMethodsWidget({
  price,
  className = "",
  compact = false,
  showTransferBadge = true,
}: PaymentMethodsWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);

  const installmentVal = price && price > 0 ? Math.round(price / 3) : null;
  const transferVal = price && price > 0 ? Math.round(price * 0.90) : null; // 10% OFF

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card/60 transition-all duration-200 ${
        compact ? "p-3.5" : "p-4 sm:p-5"
      } ${className}`}
    >
      {/* Header con cuotas destacadas */}
      {installmentVal && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                Financiación en cuotas
              </p>
              <p className="text-sm sm:text-base font-black text-foreground leading-snug">
                <span className="text-emerald-600">3 cuotas fijas</span> sin interés de{" "}
                <span className="text-emerald-600">${installmentVal.toLocaleString("es-AR")}</span>
              </p>
            </div>
          </div>

          {showTransferBadge && transferVal && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>10% OFF Transferencia: ${transferVal.toLocaleString("es-AR")}</span>
            </div>
          )}
        </div>
      )}

      {/* Título cuando es compacto o no hay precio */}
      {!installmentVal && (
        <div className="mb-2.5 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Medios de pago disponibles
          </p>
        </div>
      )}

      {/* Grid de tarjetas estilo Wigy */}
      <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
        {PAYMENT_METHODS.map((m) => (
          <div
            key={m.key}
            title={m.label}
            className="flex items-center justify-center rounded-lg border border-border/90 bg-background px-2 py-1 shadow-2xs hover:border-primary/40 transition-colors w-[52px] h-[32px] sm:w-[58px] sm:h-[36px] overflow-hidden"
          >
            <img
              src={m.src}
              alt={m.label}
              loading="lazy"
              className="max-h-[20px] max-w-[92%] object-contain block select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Footer de seguridad y botón de ver medios de pago */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-foreground">Pago 100% seguro</span>
          <span>· Datos protegidos con cifrado SSL</span>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
        >
          <span>{showDetails ? "Ocultar detalles" : "Ver medios de pago"}</span>
          {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Modal/Acordeón desplegable con detalles completos */}
      {showDetails && (
        <div className="mt-3.5 space-y-3 rounded-xl border border-border/80 bg-background/80 p-3.5 text-xs text-foreground/90 animate-in fade-in duration-200">
          <div className="space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Tarjetas de Crédito y Débito
            </p>
            <p className="text-muted-foreground">
              Aceptamos Visa, Mastercard, American Express, Cabal, Naranja X y tarjetas de débito de todos los bancos a través de Mercado Pago.
            </p>
          </div>

          <div className="space-y-1 border-t border-border/60 pt-2.5">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              Transferencia Bancaria directa (10% de descuento)
            </p>
            <p className="text-muted-foreground">
              Pagando vía transferencia inmediata o depósito recibís un 10% de descuento automático en el total de tu pedido.
            </p>
          </div>

          <div className="space-y-1 border-t border-border/60 pt-2.5">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-blue-600" />
              Billeteras Virtuales y Efectivo
            </p>
            <p className="text-muted-foreground">
              Podés pagar con dinero en cuenta de Mercado Pago, MODO, Ualá o en efectivo a través de Pago Fácil y Rapipago en todo el país.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
