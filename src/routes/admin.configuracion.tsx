import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/configuracion")({
  component: AdminConfig,
});

const FIELDS: Array<{
  key: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  help?: string;
}> = [
  { key: "wholesale_title", label: "Aviso mayorista — Título", placeholder: "Somos Mayoristas" },
  { key: "wholesale_text", label: "Aviso mayorista — Texto", textarea: true, placeholder: "Compra mínima AR$ 100.000", help: "Se muestra en la página de inicio entre Categorías y Productos destacados." },
  { key: "site_name", label: "Nombre del sitio", placeholder: "Rancho Viejo Mates" },
  { key: "tagline", label: "Frase / Eslogan", placeholder: "Mates artesanales..." },
  { key: "whatsapp_phone", label: "WhatsApp (con código de país)", placeholder: "5493815551234", help: "Sin + ni espacios. Ej: 549381..." },
  { key: "contact_phone", label: "Teléfono de contacto", placeholder: "+54 9 381 555-1234" },
  { key: "contact_email", label: "Email de contacto", placeholder: "hola@ranchoviejomates.com" },
  { key: "address", label: "Dirección", placeholder: "Av. Siempre Viva 123" },
  { key: "city", label: "Ciudad / Localidad", placeholder: "San Miguel de Tucumán" },
  { key: "province", label: "Provincia", placeholder: "Tucumán" },
  { key: "postal_code", label: "Código postal", placeholder: "4000" },
  { key: "cuit", label: "CUIT", placeholder: "20-12345678-9" },
  { key: "hours", label: "Horarios de atención", textarea: true, placeholder: "Lun a Vie 9-18hs\nSáb 9-13hs" },
  { key: "shipping_info", label: "Información de envío", textarea: true },
  { key: "cbu", label: "CBU", placeholder: "0000003100000000000000" },
  { key: "alias", label: "Alias CBU", placeholder: "rancho.viejo.mates" },
  { key: "bank_holder", label: "Titular de la cuenta", placeholder: "Nombre Apellido" },
  { key: "bank_info", label: "Banco / Tipo de cuenta", placeholder: "Banco Nación - CA $" },
  { key: "instagram_url", label: "Instagram (URL completa)", placeholder: "https://instagram.com/ranchoviejomates" },
  { key: "facebook_url", label: "Facebook (URL completa)", placeholder: "https://facebook.com/ranchoviejomates" },
];

function AdminConfig() {
  const { data, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const f: Record<string, string> = {};
      FIELDS.forEach((field) => {
        const v = (data as unknown as Record<string, unknown>)[field.key];
        f[field.key] = typeof v === "string" ? v : "";
      });
      setForm(f);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("No se encontró la configuración inicial");
      const payload: Record<string, string | null> = {};
      FIELDS.forEach((f) => {
        const val = form[f.key]?.trim() ?? "";
        payload[f.key] = val === "" ? null : val;
      });
      // site_name cannot be null
      if (!payload.site_name) payload.site_name = "Rancho Viejo Mates";
      const { error } = await supabase
        .from("site_settings")
        .update(payload as never)
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración de la tienda</h1>
        <p className="text-sm text-muted-foreground">
          Estos datos se muestran a tus clientes en toda la página.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.textarea ? (
              <Textarea
                id={f.key}
                rows={3}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            ) : (
              <Input
                id={f.key}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            )}
            {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
          </div>
        ))}

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Card>
    </div>
  );
}
