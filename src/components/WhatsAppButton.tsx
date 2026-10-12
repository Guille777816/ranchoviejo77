import { useSiteSettings, whatsappLink } from "@/lib/site-settings";

export function WhatsAppButton() {
  const { data } = useSiteSettings();
  const href = whatsappLink(
    data?.whatsapp_phone,
    `Hola! Te escribo desde ${data?.site_name ?? "la web"}.`,
  );
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chatear por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="white" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.616.094-.946-.05-.358-.974-.687-1.561-.93zM16.11 27.205c-1.6 0-3.18-.43-4.583-1.232L6.69 27.7l1.732-5.122a9.184 9.184 0 0 1-1.317-4.733c0-5.105 4.158-9.263 9.263-9.263s9.263 4.158 9.263 9.263c0 5.105-4.158 9.263-9.263 9.263z M16.11 6.205c-6.354 0-11.516 5.16-11.516 11.515 0 1.978.504 3.91 1.461 5.624L4 30l6.81-2.13a11.46 11.46 0 0 0 5.3 1.29c6.354 0 11.516-5.16 11.516-11.516 0-3.077-1.196-5.97-3.37-8.143a11.45 11.45 0 0 0-8.146-3.296z"/>
      </svg>
    </a>
  );
}
