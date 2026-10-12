import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin/banners")({
  component: BannersAdmin,
});

function BannersAdmin() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const { data: banners } = useQuery({
    queryKey: ["banners-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("image/")) throw new Error("Debe ser una imagen");
      if (file.size > 8 * 1024 * 1024) throw new Error("Máximo 8MB");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("banners")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
      const position = banners?.length ?? 0;
      const { error: insErr } = await supabase.from("banners").insert({
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        link_url: linkUrl.trim() || null,
        image_url: pub.publicUrl,
        position,
        active: true,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Banner agregado");
      qc.invalidateQueries({ queryKey: ["banners-admin"] });
      qc.invalidateQueries({ queryKey: ["banners-home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { active?: boolean; position?: number };
    }) => {
      const { error } = await supabase.from("banners").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners-admin"] });
      qc.invalidateQueries({ queryKey: ["banners-home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (b: { id: string; image_url: string }) => {
      const { error } = await supabase.from("banners").delete().eq("id", b.id);
      if (error) throw error;
      const marker = "/banners/";
      const idx = b.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = b.image_url.slice(idx + marker.length);
        await supabase.storage.from("banners").remove([path]);
      }
    },
    onSuccess: () => {
      toast.success("Banner eliminado");
      qc.invalidateQueries({ queryKey: ["banners-admin"] });
      qc.invalidateQueries({ queryKey: ["banners-home"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = (id: string, dir: -1 | 1) => {
    if (!banners) return;
    const idx = banners.findIndex((b) => b.id === id);
    const swap = banners[idx + dir];
    if (!swap) return;
    update.mutate({ id, patch: { position: swap.position } });
    update.mutate({ id: swap.id, patch: { position: banners[idx].position } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Banners de la portada</h1>
        <p className="text-sm text-muted-foreground">
          Subí imágenes que aparecen en el carrusel principal de la home.
        </p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = fileRef.current?.files?.[0];
            if (!f) {
              toast.error("Elegí una imagen");
              return;
            }
            upload.mutate(f);
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-title">Título (opcional)</Label>
              <Input
                id="b-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Nuevos mates de algarrobo"
              />
            </div>
            <div>
              <Label htmlFor="b-link">Enlace (opcional)</Label>
              <Input
                id="b-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/tienda o /categoria/mates"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="b-sub">Subtítulo (opcional)</Label>
            <Input
              id="b-sub"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Una frase corta"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="b-file">Imagen</Label>
              <Input id="b-file" ref={fileRef} type="file" accept="image/*" />
            </div>
            <Button type="submit" disabled={upload.isPending}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {upload.isPending ? "Subiendo..." : "Agregar banner"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recomendado: 1600×600 px, formato JPG o WebP, hasta 8MB.
          </p>
        </form>
      </Card>

      <Card>
        {!banners || banners.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Todavía no hay banners.
          </div>
        ) : (
          <ul className="divide-y">
            {banners.map((b, i) => (
              <li key={b.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <img
                  src={b.image_url}
                  alt={b.title ?? "banner"}
                  className="h-20 w-40 flex-none rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.title ?? "(Sin título)"}</p>
                  {b.subtitle && (
                    <p className="truncate text-sm text-muted-foreground">{b.subtitle}</p>
                  )}
                  {b.link_url && (
                    <p className="truncate text-xs text-primary">→ {b.link_url}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={b.active}
                    onCheckedChange={(v) =>
                      update.mutate({ id: b.id, patch: { active: v } })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === 0}
                    onClick={() => move(b.id, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === banners.length - 1}
                    onClick={() => move(b.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("¿Eliminar este banner?"))
                        remove.mutate({ id: b.id, image_url: b.image_url });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
