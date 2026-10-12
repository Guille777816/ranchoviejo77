import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  site_name: string;
  tagline: string | null;
  whatsapp_phone: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  cuit: string | null;
  hours: string | null;
  cbu: string | null;
  alias: string | null;
  bank_holder: string | null;
  bank_info: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  shipping_info: string | null;
  wholesale_title: string | null;
  wholesale_text: string | null;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as SiteSettings) ?? null;
    },
  });
}

export function normalizeWhatsapp(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, message?: string) {
  const num = normalizeWhatsapp(phone);
  if (!num) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${num}${text}`;
}
