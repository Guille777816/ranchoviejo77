import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit } from "lucide-react";
import { formatPrice } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/productos/")({
  component: ProductsList,
});

function ProductsList() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, active, featured, product_images(url, position)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} en total
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/productos/$id" params={{ id: "nuevo" }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : !products || products.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Todavía no cargaste productos.
          <div className="mt-4">
            <Button asChild>
              <Link to="/admin/productos/$id" params={{ id: "nuevo" }}>Crear el primero</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => {
            const img = p.product_images
              ?.slice()
              .sort((a, b) => a.position - b.position)[0]?.url;
            return (
              <Card key={p.id} className="flex items-center gap-4 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  {img && (
                    <img src={img} alt={p.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{p.name}</p>
                    {!p.active && <Badge variant="secondary">Oculto</Badge>}
                    {p.featured && <Badge>Destacado</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(p.price_cents)} · stock {p.stock}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/productos/$id" params={{ id: p.id }}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
