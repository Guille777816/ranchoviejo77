import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Search, X, Package, Tag, EyeOff, AlertTriangle, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/productos/")({
  component: ProductsList,
});

type Cat = {
  id: string;
  name: string;
  slug: string;
};

function ProductsList() {
  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock" | "hidden" | "featured">("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "stock_asc">("name");

  const { data: categories = [] } = useQuery<Cat[]>({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("position");
      if (error) throw error;
      return (data as Cat[]) ?? [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, stock, active, featured, category_id, product_images(url, position)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Conteo de productos por categoría
  const countByCat = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cid = p.category_id || "uncategorized";
      counts[cid] = (counts[cid] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Filtrado y ordenamiento de productos
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Categoría
        if (selectedCatId !== "all") {
          if (selectedCatId === "uncategorized") {
            if (p.category_id) return false;
          } else if (p.category_id !== selectedCatId) {
            return false;
          }
        }
        // Stock / Estado
        if (stockFilter === "in_stock" && (p.stock <= 0 || !p.active)) return false;
        if (stockFilter === "out_of_stock" && p.stock > 0) return false;
        if (stockFilter === "hidden" && p.active) return false;
        if (stockFilter === "featured" && !p.featured) return false;

        // Búsqueda por texto
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const nameMatch = p.name?.toLowerCase().includes(q);
          const slugMatch = p.slug?.toLowerCase().includes(q);
          if (!nameMatch && !slugMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "price_asc") return Number(a.price_cents) - Number(b.price_cents);
        if (sortBy === "price_desc") return Number(b.price_cents) - Number(a.price_cents);
        if (sortBy === "stock_asc") return Number(a.stock) - Number(b.stock);
        return 0;
      });
  }, [products, selectedCatId, stockFilter, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header y Botón Nuevo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} de {products.length} productos
            {selectedCatId !== "all" && ` en ${categories.find((c) => c.id === selectedCatId)?.name ?? "esta categoría"}`}
          </p>
        </div>
        <Button asChild className="gap-1.5 shadow-sm">
          <Link to="/admin/productos/$id" params={{ id: "nuevo" }}>
            <Plus className="h-4 w-4" /> Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Buscador y Orden */}
      <div className="grid gap-3 sm:grid-cols-12">
        <div className="relative sm:col-span-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre (ej: Mate Imperial, Camionero, Bombilla...)"
            className="pl-9 pr-9 bg-card"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="sm:col-span-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-10 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <option value="name">Ordenar: Nombre (A-Z)</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="stock_asc">Menor Stock primero</option>
          </select>
        </div>
      </div>

      {/* Pestañas de Categorías */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/50 py-1">
        <button
          onClick={() => setSelectedCatId("all")}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            selectedCatId === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>Todos</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedCatId === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"}`}>
            {products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = countByCat[cat.id] || 0;
          const isSelected = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{cat.name}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}

        {countByCat["uncategorized"] > 0 && (
          <button
            onClick={() => setSelectedCatId("uncategorized")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              selectedCatId === "uncategorized"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Sin categoría</span>
            <span className="rounded-full bg-background px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {countByCat["uncategorized"]}
            </span>
          </button>
        )}
      </div>

      {/* Subfiltros rápidos de stock */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground font-medium">Filtro rápido:</span>
        <button
          onClick={() => setStockFilter("all")}
          className={`px-2.5 py-1 rounded-md transition-colors ${stockFilter === "all" ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Todos ({products.length})
        </button>
        <button
          onClick={() => setStockFilter("in_stock")}
          className={`px-2.5 py-1 rounded-md transition-colors ${stockFilter === "in_stock" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          En stock ({products.filter((p) => p.stock > 0 && p.active).length})
        </button>
        <button
          onClick={() => setStockFilter("out_of_stock")}
          className={`px-2.5 py-1 rounded-md transition-colors ${stockFilter === "out_of_stock" ? "bg-red-500/15 text-destructive font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Sin stock ({products.filter((p) => p.stock <= 0).length})
        </button>
        <button
          onClick={() => setStockFilter("featured")}
          className={`px-2.5 py-1 rounded-md transition-colors ${stockFilter === "featured" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground"}`}
        >
          Destacados ({products.filter((p) => p.featured).length})
        </button>
        <button
          onClick={() => setStockFilter("hidden")}
          className={`px-2.5 py-1 rounded-md transition-colors ${stockFilter === "hidden" ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Ocultos ({products.filter((p) => !p.active).length})
        </button>
      </div>

      {/* Lista de productos */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="font-medium text-foreground">No se encontraron productos</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search
              ? `No hay productos que coincidan con "${search}".`
              : "No hay productos en esta categoría o filtro seleccionado."}
          </p>
          {(search || selectedCatId !== "all" || stockFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCatId("all");
                setStockFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((p) => {
            const img = p.product_images
              ?.slice()
              .sort((a, b) => a.position - b.position)[0]?.url;
            const catName = categories.find((c) => c.id === p.category_id)?.name;
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= 3;

            return (
              <Card
                key={p.id}
                className="flex items-center gap-4 p-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                  {img ? (
                    <img
                      src={img}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    {!p.active && (
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Oculto
                      </span>
                    )}
                    {p.featured && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600">
                        <Sparkles className="h-3 w-3" /> Destacado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    {catName ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {catName}
                      </Badge>
                    ) : (
                      <span className="text-amber-500 italic">Sin categoría</span>
                    )}
                    <span>·</span>
                    <span className="font-bold text-foreground text-sm">
                      {formatPrice(p.price_cents)}
                    </span>
                    <span>·</span>
                    {isOutOfStock ? (
                      <span className="font-bold text-destructive">Sin stock</span>
                    ) : isLowStock ? (
                      <span className="font-semibold text-amber-600">Últimas {p.stock} un.</span>
                    ) : (
                      <span className="text-muted-foreground">Stock: {p.stock}</span>
                    )}
                  </div>
                </div>

                <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
                  <Link to="/admin/productos/$id" params={{ id: p.id }}>
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
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
