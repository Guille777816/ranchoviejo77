import { Link } from "@tanstack/react-router";

type ProductCardProps = {
  slug: string;
  name: string;
  price_cents: number;
  image?: string;
  stock?: number;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductCard({ slug, name, price_cents, image, stock }: ProductCardProps) {
  const outOfStock = typeof stock === "number" && stock <= 0;
  return (
    <Link
      to="/producto/$slug"
      params={{ slug }}
      className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Sin imagen
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground">
            Sin stock
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{name}</p>
        <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(price_cents)}</p>
      </div>
    </Link>
  );
}

export { formatPrice };
