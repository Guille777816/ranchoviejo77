import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useSiteSettings } from "@/lib/site-settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search, ShieldCheck, ShoppingBag, ShoppingCart, User as UserIcon } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const siteName = settings?.site_name ?? "Rancho Viejo Mates";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img
            src="/logo-rancho-viejo.png"
            alt={siteName}
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: "1 / 1" }}
            className="h-9 w-9 rounded-full object-contain"
          />
        </Link>

        <form
          className="ml-auto flex flex-1 max-w-sm items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/tienda", search: { q: q || undefined, cat: undefined } });
          }}
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar mate, bombilla..."
              className="pl-8 h-9"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/tienda">
              <ShoppingBag className="mr-1 h-4 w-4" /> Tienda
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link to="/politicas">
              Políticas de devolución
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="relative">
            <Link to="/carrito" aria-label="Carrito">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ShieldCheck className="mr-1 h-4 w-4" /> Panel
              </Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link to="/auth">
                <UserIcon className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Ingresar</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
