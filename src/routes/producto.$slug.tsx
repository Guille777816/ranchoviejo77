import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard, formatPrice } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useSiteSettings, whatsappLink } from "@/lib/site-settings";
import { getOptimizedImageUrl } from "@/lib/image";
import { Check, MessageCircle, ShoppingBag } from "lucide-react";
import { ShippingCalculator } from "@/components/ShippingCalculator";

export const Route = createFileRoute("/producto/$slug")({
  head: ({ params }) => {
    const formattedSlug = params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, " ");
    return {
      meta: [
        { title: `${formattedSlug} — Rancho Viejo Mates` },
        { name: "description", content: `Comprá ${formattedSlug.toLowerCase()} artesanal en Rancho Viejo Mates. Calidad garantizada y envíos a todo el país.` },
        { property: "og:title", content: `${formattedSlug} — Rancho Viejo Mates` },
        { property: "og:description", content: `Comprá ${formattedSlug.toLowerCase()} artesanal en Rancho Viejo Mates. Calidad garantizada y envíos a todo el país.` },
        { property: "og:url", content: `https://ranchoviejo.com.ar/producto/${params.slug}` },
        { property: "og:image", content: "https://ranchoviejo.com.ar/og-image.jpg" },
      ],
      links: [
        { rel: "canonical", href: `https://ranchoviejo.com.ar/producto/${params.slug}` },
      ],
    };
  },
  component: ProductoPage,
});

function ProductoPage() {
  const { slug } = Route.useParams();
  const [activeIdx, setActiveIdx] = useState(0);
  const { add } = useCart();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, price_cents, stock, category_id, specifications, product_images(url, position), product_variants(id, name, image_url, position), categories(name, slug)",
        )
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related", product?.category_id, product?.id],
    enabled: !!product?.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, product_images(url, position)")
        .eq("active", true)
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-lg bg-muted" />
            <div className="space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
          <Link to="/tienda" className="mt-4 inline-block text-primary underline">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const images = (product.product_images ?? []).slice().sort((a, b) => a.position - b.position);
  const variants = (product.product_variants ?? []).slice().sort((a, b) => a.position - b.position);
  // activeIdx >= 0 → foto del producto; < 0 → modelo (variante)
  const activeVariant = activeIdx < 0 ? variants[-activeIdx - 1] : null;
  const mainImg = activeVariant ? activeVariant.image_url : images[activeIdx]?.url;
  const selectedVariant = activeVariant?.name?.trim() || null;
  const outOfStock = product.stock <= 0;
  const whatsappMsg = encodeURIComponent(
    `Hola! Me interesa el producto "${product.name}" (${formatPrice(product.price_cents)}). ¿Está disponible?`,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">Inicio</Link> /{" "}
          <Link to="/tienda" className="hover:underline">Tienda</Link>
          {product.categories && (
            <>
              {" / "}
              <Link
                to="/categoria/$slug"
                params={{ slug: product.categories.slug }}
                className="hover:underline"
              >
                {product.categories.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              {mainImg ? (
                <img
                  src={getOptimizedImageUrl(mainImg, 800, 85)}
                  alt={product.name}
                  fetchPriority="high"
                  decoding="async"
                  width={800}
                  height={800}
                  style={{ aspectRatio: "1 / 1" }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((im, i) => (
                  <button
                    key={im.url}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                      i === activeIdx ? "border-primary" : "border-border/60"
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(im.url, 150, 75)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      style={{ aspectRatio: "1 / 1" }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {variants.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Elegí tu modelo
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((v, i) => {
                    const idx = -(i + 1);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          idx === activeIdx
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-foreground hover:border-primary/60 hover:text-primary"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="mt-2 text-sm">
                    Modelo elegido: <span className="font-semibold text-primary">{selectedVariant}</span>
                  </p>
                )}
              </div>
            )}

          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.name}</h1>
            <p className="mt-3 text-3xl font-semibold text-primary">
              {formatPrice(product.price_cents)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {outOfStock ? "Sin stock disponible" : `Stock disponible: ${product.stock}`}
            </p>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Sobre este producto
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {product.description?.trim() || "Sin descripción disponible."}
              </div>

              {Array.isArray(product.specifications) && product.specifications.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Especificaciones
                  </h3>
                  <dl className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60">
                    {(product.specifications as Array<{ label: string; value: string }>).map(
                      (s, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-3 gap-2 px-4 py-3 text-sm"
                        >
                          <dt className="font-medium text-muted-foreground">{s.label}</dt>
                          <dd className="col-span-2 text-foreground/90">{s.value}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
              )}

              <div
                className={`mt-6 rounded-lg border border-dashed px-4 py-3 text-sm ${
                  outOfStock
                    ? "border-destructive/40 text-destructive"
                    : "border-primary/40 text-primary"
                }`}
              >
                {outOfStock ? (
                  "❌ Sin stock disponible"
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    En Stock ({product.stock} unidades disponibles)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                size="lg"
                disabled={outOfStock}
                onClick={() => {
                  add(
                    {
                      productId: product.id,
                      slug: product.slug,
                      name: selectedVariant
                        ? `${product.name} — ${selectedVariant}`
                        : product.name,
                      price_cents: product.price_cents,
                      image: mainImg,
                      stock: product.stock,
                      variant: selectedVariant ?? undefined,
                    },
                    1,
                  );
                  toast.success("Agregado al carrito");
                }}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {outOfStock ? "Sin stock" : "Agregar al carrito"}
              </Button>
              <Button
                size="lg"
                variant="default"
                disabled={outOfStock}
                onClick={() => {
                  add(
                    {
                      productId: product.id,
                      slug: product.slug,
                      name: selectedVariant
                        ? `${product.name} — ${selectedVariant}`
                        : product.name,
                      price_cents: product.price_cents,
                      image: mainImg,
                      stock: product.stock,
                      variant: selectedVariant ?? undefined,
                    },
                    1,
                  );
                  navigate({ to: "/checkout" });
                }}
              >
                Comprar ahora
              </Button>
              {(() => {
                const link =
                  whatsappLink(
                    settings?.whatsapp_phone,
                    `Hola! Me interesa el producto: ${product.name}`,
                  ) ?? `https://wa.me/?text=${whatsappMsg}`;
                return (
                  <Button asChild size="lg" variant="secondary">
                    <a href={link} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> Consultar
                    </a>
                  </Button>
                );
              })()}
            </div>

            {/* Cotizador de envíos Correo Argentino */}
            <div className="mt-6">
              <ShippingCalculator />
            </div>
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-semibold">Productos relacionados</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => {
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
          </section>
        )}
      </div>
    </div>
  );
}
