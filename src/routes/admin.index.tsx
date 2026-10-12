import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Tags, Plus, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [products, categories, orders, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Administrá tu catálogo desde acá.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/productos/$id" params={{ id: "nuevo" }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos</p>
              <p className="text-2xl font-semibold">{counts?.products ?? "—"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-2xl font-semibold">{counts?.categories ?? "—"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <Link to="/admin/pedidos" className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="text-2xl font-semibold">{counts?.orders ?? "—"}</p>
            </div>
          </Link>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-500/10 p-2 text-amber-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-semibold">{counts?.pending ?? "—"}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
