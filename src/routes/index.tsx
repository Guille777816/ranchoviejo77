import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteSettings } from "@/lib/site-settings";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mates artesanales de algarrobo y cuero | Rancho Viejo" },
      {
        name: "description",
        content:
          "Mates artesanales, bombillas, yerbas y accesorios. Grabado láser, venta mayorista y envíos a todo el país.",
      },
      { name: "robots", content: "index, follow" },
      {
        property: "og:title",
        content: "Mates artesanales de algarrobo y cuero | Rancho Viejo",
      },
      {
        property: "og:description",
        content:
          "Mates artesanales, bombillas, yerbas y accesorios. Grabado láser, venta mayorista y envíos a todo el país.",
      },
      { property: "og:url", content: "https://ranchoviejo.com.ar/" },
      { property: "og:site_name", content: "Rancho Viejo" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://ranchoviejo.com.ar/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mates artesanales de algarrobo y cuero | Rancho Viejo" },
      {
        name: "twitter:description",
        content:
          "Mates artesanales, bombillas, yerbas y accesorios. Grabado láser, venta mayorista y envíos a todo el país.",
      },
      { name: "twitter:image", content: "https://ranchoviejo.com.ar/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://ranchoviejo.com.ar/" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useSiteSettings();
  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, product_images(url, position)")
        .eq("active", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: banners } = useQuery({
    queryKey: ["banners-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, image_url, link_url")
        .eq("active", true)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["home-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_videos")
        .select("id, title, description, video_url, poster_url")
        .eq("active", true)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [slide, setSlide] = useState(0);
  const slideCount = banners?.length ?? 0;
  useEffect(() => {
    if (slideCount < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slideCount), 5000);
    return () => clearInterval(t);
  }, [slideCount]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {banners && banners.length > 0 ? (
        <section className="relative border-b bg-background min-h-[260px] sm:min-h-[320px] md:min-h-[420px]">
          <h1 className="sr-only">Mates artesanales de algarrobo, camionero y cuero</h1>
          <div className="relative mx-auto aspect-[16/7] w-full max-w-7xl overflow-hidden md:aspect-[16/5] min-h-[260px] sm:min-h-[320px] md:min-h-[420px]">
            {banners.map((b, i) => {
              const inner = (
                <>
                  <img
                    src={b.image_url}
                    alt={b.title ?? "Mates artesanales de algarrobo, camionero y cuero"}
                    width={1920}
                    height={600}
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  {(b.title || b.subtitle) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 text-center text-white">
                      {b.title && (
                        <h2 className="text-2xl font-bold drop-shadow md:text-5xl">
                          {b.title}
                        </h2>
                      )}
                      {b.subtitle && (
                        <p className="mt-2 max-w-xl text-sm md:text-lg">{b.subtitle}</p>
                      )}
                    </div>
                  )}
                </>
              );
              return (
                <div
                  key={b.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    i === slide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {b.link_url ? (
                    <a href={b.link_url} className="block h-full w-full">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </div>
              );
            })}
            {banners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir al banner ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === slide ? "w-6 bg-primary" : "w-2 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="border-b bg-secondary/40 min-h-[260px] sm:min-h-[320px] md:min-h-[420px] flex items-center">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-20 w-full">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Mates artesanales de algarrobo, camionero y cuero
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
              Trabajo artesanal, materiales nobles y la tradición de siempre.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild size="lg">
                <Link to="/tienda">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Ver tienda
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-4 text-xl font-semibold">Categorías</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      {(settings?.wholesale_title || settings?.wholesale_text) && (
        <section className="mx-auto max-w-6xl px-4 pb-2 pt-4">
          <div className="rounded-xl border-2 border-primary/40 bg-primary/10 p-5 text-center shadow-sm">
            {settings?.wholesale_title && (
              <h3 className="text-xl font-bold text-primary md:text-2xl">
                {settings.wholesale_title}
              </h3>
            )}
            {settings?.wholesale_text && (
              <p className="mt-1 whitespace-pre-line text-sm md:text-base">
                {settings.wholesale_text}
              </p>
            )}
          </div>
        </section>
      )}


      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Productos destacados</h2>
          <Link to="/tienda" className="text-sm text-primary hover:underline">
            Ver todo →
          </Link>
        </div>
        {!featured || featured.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
            Aún no hay productos destacados.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => {
              const img = p.product_images
                ?.slice()
                .sort((a, b) => a.position - b.position)[0]?.url;
              return (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  name={p.name}
                  price_cents={p.price_cents}
                  image={img}
                  stock={p.stock}
                />
              );
            })}
          </div>
        )}
      </section>

      {videos && videos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="mb-6 text-2xl font-semibold">Conocenos en video</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border bg-card">
                <video
                  src={v.video_url}
                  controls
                  playsInline
                  preload="metadata"
                  poster={v.poster_url ?? undefined}
                  className="aspect-video w-full bg-black"
                />
                {(v.title || v.description) && (
                  <div className="p-4">
                    {v.title && <h3 className="font-semibold">{v.title}</h3>}
                    {v.description && (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                        {v.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

