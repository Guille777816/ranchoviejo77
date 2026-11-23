import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ImagePlus, Plus, Trash2, Package } from "lucide-react";
import { slugify } from "@/lib/slug";
import {
  extractShippingDimensions,
  mergeShippingDimensionsIntoSpecs,
  type ShippingDimensions,
} from "@/lib/shipping";

export const Route = createFileRoute("/admin/productos/$id")({
  component: ProductEditor,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(120),
  description: z.string().max(5000).optional().nullable(),
  price: z.number().min(0).max(100_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  category_id: z.string().uuid().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
});

const NONE = "__none__";

function ProductEditor() {
  const { id } = Route.useParams();
  const isNew = id === "nuevo";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [stock, setStock] = useState<string>("0");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>([]);
  const [weightGrams, setWeightGrams] = useState<string>("450");
  const [heightCm, setHeightCm] = useState<string>("15");
  const [widthCm, setWidthCm] = useState<string>("12");
  const [lengthCm, setLengthCm] = useState<string>("12");
  const [declaredValue, setDeclaredValue] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(id, url, position, label), product_variants(id, name, image_url, position)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setPrice(String(product.price_cents / 100));
      setStock(String(product.stock));
      setCategoryId(product.category_id);
      setActive(product.active);
      setFeatured(product.featured);
      const raw = (product as unknown as { specifications?: unknown }).specifications;
      const allSpecs = Array.isArray(raw) ? (raw as Array<{ label: string; value: string }>) : [];
      setSpecs(
        allSpecs.filter(
          (s) =>
            !["peso", "alto", "altura", "ancho", "largo", "dimensiones", "valor declarado"].includes(
              (s.label || "").toLowerCase().trim()
            )
        )
      );

      const dims = extractShippingDimensions(raw, product.price_cents);
      setWeightGrams(String(dims.weightGrams));
      setHeightCm(String(dims.heightCm));
      setWidthCm(String(dims.widthCm));
      setLengthCm(String(dims.lengthCm));
      setDeclaredValue(
        dims.declaredValueCents && dims.declaredValueCents !== product.price_cents
          ? String(dims.declaredValueCents / 100)
          : ""
      );
    }
  }, [product]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name,
        description: description || null,
        price: Number(price),
        stock: Number(stock),
        category_id: categoryId,
        active,
        featured,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      const cleanedSpecs = specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label || s.value);

      const shippingDims: ShippingDimensions = {
        weightGrams: Number(weightGrams) || 450,
        heightCm: Number(heightCm) || 15,
        widthCm: Number(widthCm) || 12,
        lengthCm: Number(lengthCm) || 12,
        declaredValueCents: declaredValue ? Math.round(Number(declaredValue) * 100) : undefined,
      };

      const finalSpecs = mergeShippingDimensionsIntoSpecs(cleanedSpecs, shippingDims);

      const payload = {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description,
        price_cents: Math.round(parsed.data.price * 100),
        stock: parsed.data.stock,
        category_id: parsed.data.category_id,
        active: parsed.data.active,
        featured: parsed.data.featured,
        specifications: finalSpecs,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      } else {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
    },
    onSuccess: (newId) => {
      toast.success(isNew ? "Producto creado" : "Cambios guardados");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["product", newId] });
      if (isNew) navigate({ to: "/admin/productos/$id", params: { id: newId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/productos" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      if (isNew) throw new Error("Guardá el producto antes de subir imágenes");
      if (!file.type.startsWith("image/")) throw new Error("Archivo no es imagen");
      if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5MB");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);

      const position = (product?.product_images?.length ?? 0);
      const { error: insErr } = await supabase
        .from("product_images")
        .insert({ product_id: id, url: pub.publicUrl, position });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Imagen subida");
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeImage = useMutation({
    mutationFn: async (imageId: string) => {
      const img = product?.product_images?.find((i) => i.id === imageId);
      const { error } = await supabase.from("product_images").delete().eq("id", imageId);
      if (error) throw error;
      // Try to remove from storage as well (best-effort, parse path)
      if (img) {
        const marker = "/product-images/";
        const idx = img.url.indexOf(marker);
        if (idx !== -1) {
          const path = img.url.slice(idx + marker.length);
          await supabase.storage.from("product-images").remove([path]);
        }
      }
    },
    onSuccess: () => {
      toast.success("Imagen eliminada");
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const [newVariantName, setNewVariantName] = useState("");
  const [variantFile, setVariantFile] = useState<File | null>(null);

  const addVariant = useMutation({
    mutationFn: async () => {
      if (isNew) throw new Error("Guardá el producto antes de agregar modelos");
      if (!newVariantName.trim()) throw new Error("Escribí el nombre del modelo");
      if (!variantFile) throw new Error("Elegí la fotito del modelo");
      if (!variantFile.type.startsWith("image/")) throw new Error("Archivo no es imagen");
      if (variantFile.size > 5 * 1024 * 1024) throw new Error("Máximo 5MB");

      const ext = variantFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, variantFile, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);

      const position = (product?.product_variants?.length ?? 0);
      const { error: insErr } = await supabase
        .from("product_variants")
        .insert({ product_id: id, name: newVariantName.trim(), image_url: pub.publicUrl, position });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Modelo agregado");
      setNewVariantName("");
      setVariantFile(null);
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeVariant = useMutation({
    mutationFn: async (variantId: string) => {
      const v = product?.product_variants?.find((x) => x.id === variantId);
      const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
      if (error) throw error;
      if (v) {
        const marker = "/product-images/";
        const idx = v.image_url.indexOf(marker);
        if (idx !== -1) {
          await supabase.storage
            .from("product-images")
            .remove([v.image_url.slice(idx + marker.length)]);
        }
      }
    },
    onSuccess: () => {
      toast.success("Modelo eliminado");
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveVariantName = useMutation({
    mutationFn: async ({ variantId, name }: { variantId: string; name: string }) => {
      const { error } = await supabase
        .from("product_variants")
        .update({ name: name.trim() })
        .eq("id", variantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nombre guardado");
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isNew && isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/productos">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Link>
        </Button>
        {!isNew && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("¿Eliminar este producto?")) remove.mutate();
            }}
          >
            <Trash2 className="mr-1 h-4 w-4 text-destructive" />
            Eliminar
          </Button>
        )}
      </div>

      <Card className="space-y-4 p-4">
        <h1 className="text-xl font-semibold">
          {isNew ? "Nuevo producto" : "Editar producto"}
        </h1>

        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="desc">Descripción</Label>
          <Textarea
            id="desc"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Precio (ARS)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Categoría</Label>
          <Select
            value={categoryId ?? NONE}
            onValueChange={(v) => setCategoryId(v === NONE ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin categoría</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium">Especificaciones</p>
              <p className="text-xs text-muted-foreground">
                Aparecen como tabla en la página del producto (ej: Material → PVC).
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSpecs((p) => [...p, { label: "", value: "" }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {specs.length === 0 && (
              <p className="text-xs text-muted-foreground">Aún sin especificaciones.</p>
            )}
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  placeholder="Característica"
                  value={s.label}
                  onChange={(e) =>
                    setSpecs((p) =>
                      p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  placeholder="Valor"
                  value={s.value}
                  onChange={(e) =>
                    setSpecs((p) =>
                      p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))}
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de medidas y embalaje para envíos */}
        <div className="rounded-md border border-border/80 bg-card p-4 space-y-4">
          <div>
            <p className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Medidas y Embalaje para Envíos (Cotizador de 3 Correos)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Definí el peso y medidas de este producto. El cotizador calculará el precio justo de Correo Argentino, Andreani y OCA automáticamente según la cantidad que elija el cliente.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="weight" className="text-xs text-foreground font-medium">Peso (en gramos)</Label>
              <Input
                id="weight"
                type="number"
                min="10"
                step="10"
                placeholder="ej: 450"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className="mt-1 bg-background text-foreground border-border/80 focus:border-primary font-semibold text-sm"
              />
              <span className="text-[10px] text-muted-foreground">ej: 450 g = 0.45 kg</span>
            </div>

            <div>
              <Label htmlFor="height" className="text-xs text-foreground font-medium">Alto (cm)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                step="1"
                placeholder="ej: 15"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="mt-1 bg-background text-foreground border-border/80 focus:border-primary font-semibold text-sm"
              />
              <span className="text-[10px] text-muted-foreground">Altura de la caja</span>
            </div>

            <div>
              <Label htmlFor="width" className="text-xs text-foreground font-medium">Ancho (cm)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                step="1"
                placeholder="ej: 12"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                className="mt-1 bg-background text-foreground border-border/80 focus:border-primary font-semibold text-sm"
              />
              <span className="text-[10px] text-muted-foreground">Ancho de la caja</span>
            </div>

            <div>
              <Label htmlFor="length" className="text-xs text-foreground font-medium">Largo (cm)</Label>
              <Input
                id="length"
                type="number"
                min="1"
                step="1"
                placeholder="ej: 12"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                className="mt-1 bg-background text-foreground border-border/80 focus:border-primary font-semibold text-sm"
              />
              <span className="text-[10px] text-muted-foreground">Largo de la caja</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-3 border-t border-border/60">
            <div>
              <Label htmlFor="decVal" className="text-xs text-foreground font-medium">Valor Declarado para Seguro (ARS - Opcional)</Label>
              <Input
                id="decVal"
                type="number"
                min="0"
                step="100"
                placeholder="Dejar vacío para usar el precio de venta"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                className="mt-1 bg-background text-foreground border-border/80 focus:border-primary font-semibold text-sm"
              />
              <span className="text-[10px] text-muted-foreground">
                Si se deja vacío, se asegura automáticamente por el precio de venta (${price || 0}).
              </span>
            </div>

            <div className="flex items-center">
              <div className="w-full text-xs bg-background/60 p-3 rounded-lg border border-border/60">
                <p className="font-semibold text-foreground">Aforo volumétrico estimado:</p>
                <p className="mt-0.5 text-muted-foreground">
                  {((Number(heightCm || 15) * Number(widthCm || 12) * Number(lengthCm || 12)) / 4000).toFixed(2)} kg
                  {" "}(los correos cobran por el mayor entre peso físico y aforo).
                </p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="font-medium">Activo</p>
            <p className="text-xs text-muted-foreground">
              Visible en la tienda
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="font-medium">Destacado</p>
            <p className="text-xs text-muted-foreground">
              Aparece en la portada
            </p>
          </div>
          <Switch checked={featured} onCheckedChange={setFeatured} />
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending ? "Guardando..." : isNew ? "Crear producto" : "Guardar cambios"}
        </Button>
      </Card>

      {!isNew && (
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Fotos del producto</h2>
              <p className="text-xs text-muted-foreground">
                La primera foto es la principal que se ve en grande. Subí solo las fotos del
                producto; los modelos se cargan aparte en la sección de abajo.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80">
              <ImagePlus className="h-4 w-4" />
              {uploadImage.isPending ? "Subiendo..." : "Subir"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadImage.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {!product?.product_images || product.product_images.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún sin imágenes.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.product_images
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((img) => (
                  <div key={img.id} className="rounded-md border">
                    <div className="group relative overflow-hidden rounded-t-md">
                      <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("¿Eliminar esta opción?")) removeImage.mutate(img.id);
                        }}
                        className="absolute right-1 top-1 rounded bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Eliminar imagen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {!isNew && (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-semibold">Modelos (cuadritos debajo de la foto)</h2>
            <p className="text-xs text-muted-foreground">
              Cada modelo tiene su nombre y su fotito. En la página del producto aparecen como
              cuadritos debajo de la foto grande; al presionarlos, la foto grande cambia. No se
              muestran entre las fotos del producto.
            </p>
          </div>

          <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder="Nombre del modelo (ej: Calabaza natural seleccionada)"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
            />
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80">
              <ImagePlus className="h-4 w-4" />
              {variantFile ? variantFile.name : "Elegir fotito"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setVariantFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              type="button"
              onClick={() => addVariant.mutate()}
              disabled={addVariant.isPending}
            >
              <Plus className="mr-1 h-4 w-4" />
              {addVariant.isPending ? "Subiendo..." : "Agregar modelo"}
            </Button>
          </div>

          {!product?.product_variants || product.product_variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún sin modelos.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.product_variants
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((v) => (
                  <div key={v.id} className="rounded-md border">
                    <div className="group relative overflow-hidden rounded-t-md">
                      <img
                        src={v.image_url}
                        alt={v.name}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("¿Eliminar este modelo?")) removeVariant.mutate(v.id);
                        }}
                        className="absolute right-1 top-1 rounded bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Eliminar modelo"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                    <div className="p-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Nombre del modelo"
                        defaultValue={v.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== v.name.trim()) {
                            saveVariantName.mutate({ variantId: v.id, name: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
