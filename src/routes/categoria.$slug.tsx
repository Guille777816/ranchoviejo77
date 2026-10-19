import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const formattedSlug = params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, " ");
    return {
      meta: [
        { title: `${formattedSlug} — Rancho Viejo Mates` },
        { name: "description", content: `Comprá ${formattedSlug.toLowerCase()} artesanales de calidad superior en Rancho Viejo Mates. Envíos rápidos a todo el país.` },
        { property: "og:title", content: `${formattedSlug} — Rancho Viejo Mates` },
        { property: "og:description", content: `Comprá ${formattedSlug.toLowerCase()} artesanales de calidad superior en Rancho Viejo Mates. Envíos rápidos a todo el país.` },
        { property: "og:url", content: `https://www.ranchoviejo.com.ar/categoria/${params.slug}` },
        { property: "og:image", content: "https://www.ranchoviejo.com.ar/logo-rancho-viejo.jpg" },
      ],
      links: [
        { rel: "canonical", href: `https://www.ranchoviejo.com.ar/categoria/${params.slug}` },
      ],
    };
  },
  component: CategoriaPage,
});

function CategoriaPage() {
  const { slug } = Route.useParams();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, landing_title, landing_description, landing_image_url, landing_video_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["category-products", category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, product_images(url, position)")
        .eq("active", true)
        .eq("category_id", category!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!catLoading && !category) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Categoría no encontrada</h1>
          <Link to="/tienda" className="mt-4 inline-block text-primary underline">Ver tienda</Link>
        </div>
      </div>
    );
  }

  const hasLanding =
    category?.landing_title ||
    category?.landing_description ||
    category?.landing_image_url ||
    category?.landing_video_url;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {hasLanding && (
        <section className="relative border-b bg-black">
          {category?.landing_image_url && (
            <div className="absolute inset-0 opacity-30">
              <img src={category.landing_image_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-background" />
            </div>
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
            <h1 className="text-3xl font-bold text-white md:text-5xl">
              {category?.landing_title ?? category?.name}
            </h1>
            {category?.landing_description && (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base text-white/90 md:text-lg">
                {category.landing_description}
              </p>
            )}
            {category?.landing_video_url && (
              <div className="mt-8 overflow-hidden rounded-lg bg-black shadow-lg">
                <video
                  src={category.landing_video_url}
                  controls
                  playsInline
                  poster={category.landing_image_url ?? undefined}
                  className="w-full max-w-3xl"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">Inicio</Link> /{" "}
          <Link to="/tienda" className="hover:underline">Tienda</Link> /{" "}
          <span className="text-foreground">{category?.name ?? slug}</span>
        </nav>
        {!hasLanding && (
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{category?.name}</h1>
        )}
        {hasLanding && (
          <h2 className="mt-4 text-xl font-semibold md:text-2xl">Productos disponibles</h2>
        )}

        <div className="mt-6">
          {!products || products.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
              Aún no hay productos en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.map((p) => {
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
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
