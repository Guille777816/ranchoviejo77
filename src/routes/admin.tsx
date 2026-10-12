import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Package, Tags, LayoutDashboard, ShoppingCart, Image as ImageIcon, Settings, Video } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Panel — Rancho Viejo Mates" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted-foreground">
          Verificando acceso...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <aside className="space-y-1">
            <NavItem to="/admin" label="Resumen" icon={<LayoutDashboard className="h-4 w-4" />} />
            <NavItem to="/admin/productos" label="Productos" icon={<Package className="h-4 w-4" />} />
            <NavItem to="/admin/categorias" label="Categorías" icon={<Tags className="h-4 w-4" />} />
            <NavItem to="/admin/pedidos" label="Pedidos" icon={<ShoppingCart className="h-4 w-4" />} />
            <NavItem to="/admin/banners" label="Banners" icon={<ImageIcon className="h-4 w-4" />} />
            <NavItem to="/admin/videos" label="Videos" icon={<Video className="h-4 w-4" />} />
            <NavItem to="/admin/configuracion" label="Configuración" icon={<Settings className="h-4 w-4" />} />
          </aside>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/admin" }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
      activeProps={{ className: "bg-sidebar-accent font-medium" }}
    >
      {icon}
      {label}
    </Link>
  );
}
