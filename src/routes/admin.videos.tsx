import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Video, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin/videos")({
  component: VideosAdmin,
});

function VideosAdmin() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: videos } = useQuery({
    queryKey: ["home-videos-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_videos")
        .select("*")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("video/")) throw new Error("Debe ser un video");
      if (file.size > 50 * 1024 * 1024) throw new Error("Máximo 50MB");
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("banners")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
      const position = videos?.length ?? 0;
      const { error: insErr } = await supabase.from("home_videos").insert({
        title: title.trim() || null,
        description: description.trim() || null,
        video_url: pub.publicUrl,
        position,
        active: true,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Video agregado");
      qc.invalidateQueries({ queryKey: ["home-videos-admin"] });
      qc.invalidateQueries({ queryKey: ["home-videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { active?: boolean; position?: number } }) => {
      const { error } = await supabase.from("home_videos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-videos-admin"] });
      qc.invalidateQueries({ queryKey: ["home-videos"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (v: { id: string; video_url: string }) => {
      const { error } = await supabase.from("home_videos").delete().eq("id", v.id);
      if (error) throw error;
      const marker = "/banners/";
      const idx = v.video_url.indexOf(marker);
      if (idx !== -1) {
        const path = v.video_url.slice(idx + marker.length);
        await supabase.storage.from("banners").remove([path]);
      }
    },
    onSuccess: () => {
      toast.success("Video eliminado");
      qc.invalidateQueries({ queryKey: ["home-videos-admin"] });
      qc.invalidateQueries({ queryKey: ["home-videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = (id: string, dir: -1 | 1) => {
    if (!videos) return;
    const idx = videos.findIndex((v) => v.id === id);
    const swap = videos[idx + dir];
    if (!swap) return;
    update.mutate({ id, patch: { position: swap.position } });
    update.mutate({ id: swap.id, patch: { position: videos[idx].position } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Videos de la portada</h1>
        <p className="text-sm text-muted-foreground">
          Se muestran en la home debajo de los productos destacados.
        </p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = fileRef.current?.files?.[0];
            if (!f) return toast.error("Elegí un video");
            upload.mutate(f);
          }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="v-title">Título (opcional)</Label>
            <Input id="v-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="v-desc">Descripción (opcional)</Label>
            <Textarea id="v-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="v-file">Video (mp4/webm, máx 50MB)</Label>
              <Input id="v-file" ref={fileRef} type="file" accept="video/mp4,video/webm" />
            </div>
            <Button type="submit" disabled={upload.isPending}>
              <Video className="mr-2 h-4 w-4" />
              {upload.isPending ? "Subiendo..." : "Agregar video"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        {!videos || videos.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Todavía no hay videos.
          </div>
        ) : (
          <ul className="divide-y">
            {videos.map((v, i) => (
              <li key={v.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <video
                  src={v.video_url}
                  className="h-20 w-32 flex-none rounded-md bg-black object-cover"
                  muted
                  preload="metadata"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.title ?? "(Sin título)"}</p>
                  {v.description && (
                    <p className="truncate text-sm text-muted-foreground">{v.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={v.active}
                    onCheckedChange={(a) => update.mutate({ id: v.id, patch: { active: a } })}
                  />
                  <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(v.id, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === videos.length - 1}
                    onClick={() => move(v.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("¿Eliminar este video?"))
                        remove.mutate({ id: v.id, video_url: v.video_url });
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
