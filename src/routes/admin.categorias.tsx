import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil, Save, X, ImagePlus, Video } from "lucide-react";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesAdmin,
});

type Cat = {
  id: string;
  name: string;
  slug: string;
  position: number;
  landing_title: string | null;
  landing_description: string | null;
  landing_image_url: string | null;
  landing_video_url: string | null;
};

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as unknown as Cat[];
    },
  });

  const create = useMutation({
    mutationFn: async (n: string) => {
      const trimmed = n.trim();
      if (trimmed.length < 2) throw new Error("Nombre demasiado corto");
      const { error } = await supabase
        .from("categories")
        .insert({ name: trimmed, slug: slugify(trimmed) });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      toast.success("Categoría creada");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories-home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoría eliminada");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories-home"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Editá cada categoría para configurar su landing (título, texto, imagen y video).
        </p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(name);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label htmlFor="cat-name">Nueva categoría</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Virolas" />
          </div>
          <Button type="submit" disabled={create.isPending}>Agregar</Button>
        </form>
      </Card>

      <Card>
        {!categories || categories.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Todavía no hay categorías.</div>
        ) : (
          <ul className="divide-y">
            {categories.map((c) =>
              editingId === c.id ? (
                <li key={c.id} className="p-3">
                  <EditForm cat={c} onClose={() => setEditingId(null)} />
                </li>
              ) : (
                <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      /categoria/{c.slug}
                      {c.landing_title && <span className="ml-2 text-primary">· Landing: {c.landing_title}</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`¿Eliminar "${c.name}"?`)) remove.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ),
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

function EditForm({ cat, onClose }: { cat: Cat; onClose: () => void }) {
  const qc = useQueryClient();
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: cat.name,
    landing_title: cat.landing_title ?? "",
    landing_description: cat.landing_description ?? "",
    landing_image_url: cat.landing_image_url ?? "",
    landing_video_url: cat.landing_video_url ?? "",
  });
  useEffect(() => {
    setForm({
      name: cat.name,
      landing_title: cat.landing_title ?? "",
      landing_description: cat.landing_description ?? "",
      landing_image_url: cat.landing_image_url ?? "",
      landing_video_url: cat.landing_video_url ?? "",
    });
  }, [cat.id]);

  const uploadFile = async (file: File, kind: "image" | "video") => {
    const max = kind === "image" ? 8 : 50;
    if (file.size > max * 1024 * 1024) throw new Error(`Máximo ${max}MB`);
    const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "image" ? "jpg" : "mp4");
    const path = `landings/${cat.slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("banners")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
  };

  const save = useMutation({
    mutationFn: async () => {
      let image_url = form.landing_image_url || null;
      let video_url = form.landing_video_url || null;
      const imgFile = imgRef.current?.files?.[0];
      const vidFile = vidRef.current?.files?.[0];
      if (imgFile) image_url = await uploadFile(imgFile, "image");
      if (vidFile) video_url = await uploadFile(vidFile, "video");
      const { error } = await supabase
        .from("categories")
        .update({
          name: form.name.trim(),
          landing_title: form.landing_title.trim() || null,
          landing_description: form.landing_description.trim() || null,
          landing_image_url: image_url,
          landing_video_url: video_url,
        })
        .eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoría actualizada");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories-home"] });
      qc.invalidateQueries({ queryKey: ["category", cat.slug] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Editar: {cat.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div>
        <Label>Nombre</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-3">
        <p className="text-sm font-medium">🎯 Landing page de la categoría</p>
        <div>
          <Label>Título (ej: Fábrica de virolas)</Label>
          <Input
            value={form.landing_title}
            onChange={(e) => setForm((p) => ({ ...p, landing_title: e.target.value }))}
            placeholder="Fábrica de virolas"
          />
        </div>
        <div>
          <Label>Texto / descripción</Label>
          <Textarea
            rows={5}
            value={form.landing_description}
            onChange={(e) => setForm((p) => ({ ...p, landing_description: e.target.value }))}
            placeholder="Contá la historia de la fábrica, materiales, proceso..."
          />
        </div>
        <div>
          <Label>Imagen de portada</Label>
          {form.landing_image_url && (
            <img src={form.landing_image_url} alt="" className="mb-2 h-24 rounded object-cover" />
          )}
          <Input ref={imgRef} type="file" accept="image/*" />
          <p className="text-xs text-muted-foreground mt-1"><ImagePlus className="inline h-3 w-3" /> Máx 8MB</p>
        </div>
        <div>
          <Label>Video de la máquina / fábrica trabajando</Label>
          {form.landing_video_url && (
            <video src={form.landing_video_url} muted controls className="mb-2 h-32 w-full max-w-xs rounded bg-black" />
          )}
          <Input ref={vidRef} type="file" accept="video/mp4,video/webm" />
          <p className="text-xs text-muted-foreground mt-1"><Video className="inline h-3 w-3" /> Máx 50MB</p>
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {save.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
