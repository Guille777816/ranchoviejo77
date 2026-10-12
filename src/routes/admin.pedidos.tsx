import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/components/ProductCard";
import { toast } from "sonner";
import { resendOrderConfirmation } from "@/lib/orders-email.functions";

export const Route = createFileRoute("/admin/pedidos")({
  component: PedidosAdmin,
});

const STATUSES = ["pending", "paid", "cancelled", "shipped", "delivered"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  cancelled: "Cancelado",
  shipped: "Enviado",
  delivered: "Entregado",
};

const MAIL_LABEL: Record<string, string> = {
  sent: "Mail enviado",
  bounced: "Mail rebotado",
  failed: "Mail falló",
  suppressed: "Mail bloqueado",
};

function PedidosAdmin() {
  const qc = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, status, customer_name, customer_email, customer_phone, customer_dni, shipping_address, shipping_city, shipping_province, shipping_zip, notes, subtotal_cents, shipping_cents, total_cents, created_at, order_items(product_name, quantity, unit_price_cents, variant)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const emails = (orders ?? []).map((o) => o.customer_email);
  const { data: mailStatus } = useQuery({
    queryKey: ["admin-orders-mail", emails.join(",")],
    enabled: emails.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_email_status", {
        _emails: emails,
      });
      if (error) throw error;
      const map: Record<string, { status: string; error_message: string | null }> = {};
      for (const row of data ?? []) {
        map[row.recipient_email] = {
          status: row.status,
          error_message: row.error_message,
        };
      }
      return map;
    },
  });

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Pedido actualizado");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-semibold">Pedidos</h1>
      <p className="text-sm text-muted-foreground">
        Últimos 100 pedidos con todos los datos del cliente.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
      )}
      {orders?.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no hay pedidos.</p>
      )}

      <div className="mt-4 space-y-4">
        {orders?.map((o) => (
          <div key={o.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("es-AR")} · #{o.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatPrice(o.total_cents)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={o.status}
                  onValueChange={(v) => updateStatus(o.id, v as Status)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/pedido/$id" params={{ id: o.id }}>
                    Ver
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </h3>
                <dl className="space-y-1 text-sm">
                  <Row label="Nombre" value={o.customer_name} />
                  <Row label="Email" value={o.customer_email} />
                  <Row label="Teléfono" value={o.customer_phone} />
                  <Row label="DNI" value={(o as any).customer_dni} />
                </dl>
                <EmailTools
                  orderId={o.id}
                  currentEmail={o.customer_email}
                  mail={mailStatus?.[o.customer_email]}
                  onDone={() => {
                    qc.invalidateQueries({ queryKey: ["admin-orders"] });
                    qc.invalidateQueries({ queryKey: ["admin-orders-mail"] });
                  }}
                />

              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Envío
                </h3>
                <dl className="space-y-1 text-sm">
                  <Row label="Dirección" value={o.shipping_address} />
                  <Row label="Ciudad" value={o.shipping_city} />
                  <Row label="Provincia" value={o.shipping_province} />
                  <Row label="CP" value={o.shipping_zip} />
                </dl>
              </div>
            </div>

            {o.notes && (
              <div className="mt-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notas / Observaciones
                </h3>
                <p className="text-sm whitespace-pre-wrap">{o.notes}</p>
              </div>
            )}

            <div className="mt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Items
              </h3>
              <ul className="text-sm">
                {o.order_items?.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between border-b py-1 last:border-0"
                  >
                    <span>
                      {it.quantity}× {it.product_name}
                      {it.variant ? (
                        <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {it.variant}
                        </span>
                      ) : null}
                    </span>
                    <span>{formatPrice(it.unit_price_cents * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailTools({
  orderId,
  currentEmail,
  mail,
  onDone,
}: {
  orderId: string;
  currentEmail: string;
  mail?: { status: string; error_message: string | null };
  onDone: () => void;
}) {
  const resend = useServerFn(resendOrderConfirmation);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [busy, setBusy] = useState(false);

  const bad = mail && mail.status !== "sent";

  const doResend = async (newEmail?: string) => {
    setBusy(true);
    try {
      await resend({ data: { orderId, email: newEmail ?? null } });
      toast.success("Email de confirmación reenviado");
      setEditing(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reenviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={
            bad
              ? "rounded bg-destructive/15 px-2 py-0.5 text-destructive"
              : mail
                ? "rounded bg-primary/15 px-2 py-0.5 text-primary"
                : "rounded bg-muted px-2 py-0.5 text-muted-foreground"
          }
        >
          {mail ? (MAIL_LABEL[mail.status] ?? mail.status) : "Sin registro de mail"}
        </span>
        {mail?.error_message && (
          <span className="text-muted-foreground">{mail.error_message}</span>
        )}
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 max-w-[240px]"
          />
          <Button size="sm" disabled={busy} onClick={() => doResend(email)}>
            {busy ? "Enviando..." : "Corregir y enviar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => doResend()}>
            {busy ? "Enviando..." : "Reenviar confirmación"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Corregir email
          </Button>
        </div>
      )}
    </div>
  );
}


function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="flex-1 break-words">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
