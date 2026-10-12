import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/tienda")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Tienda — Rancho Viejo Mates" },
      { name: "description", content: "Catálogo completo de mates, bombillas y accesorios." },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const { q, cat } = Route.useSearch();

  const { data: categories } = useQuery({
    queryKey: ["categories-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-public", q ?? "", cat ?? ""],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, category_id, product_images(url, position)")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (q && q.trim()) {
        query = query.ilike("name", `%${q.trim()}%`);
      }
      if (cat) {
        const matched = categories?.find((c) => c.slug === cat);
        if (matched) query = query.eq("category_id", matched.id);
      }

      const { data, error } = await query.limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !cat || !!categories,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tienda</h1>
        {q && (
          <p className="mt-1 text-sm text-muted-foreground">
            Resultados para “{q}”
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/tienda"
            search={{ q, cat: undefined }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              !cat ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
            )}
          >
            Todos
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              to="/tienda"
              search={{ q, cat: c.slug }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                cat === c.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
              No encontramos productos.
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
    </div>
  );
}
