export type ShippingOptionId =
  | "caba"
  | "buenos-aires"
  | "resto-pais"
  | "sucursal-correo";

export type ShippingOption = {
  id: ShippingOptionId;
  name: string;
  description: string;
  price: number;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "caba",
    name: "Capital Federal (CABA)",
    description: "Envío a domicilio en Capital Federal por Correo Argentino",
    price: 7000,
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    description: "Envío a domicilio en GBA e interior de Bs. As. por Correo Argentino",
    price: 10000,
  },
  {
    id: "resto-pais",
    name: "Resto del país",
    description: "Envío a domicilio a todo el interior de Argentina por Correo Argentino",
    price: 18000,
  },
  {
    id: "sucursal-correo",
    name: "Retiro en Sucursal Correo Argentino",
    description: "Retiro en la sucursal de Correo Argentino más cercana a tu domicilio",
    price: 14500,
  },
];

export function getShippingOption(id: string): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

export function suggestShippingOption(postalCode: string, province: string): ShippingOptionId {
  const prov = (province || "").toLowerCase().trim();
  const cpNum = parseInt(postalCode.replace(/\D/g, ""), 10);

  if (prov.includes("caba") || prov.includes("capital") || (cpNum >= 1000 && cpNum <= 1499)) {
    return "caba";
  }
  if (
    prov.includes("buenos aires") ||
    prov.includes("bs as") ||
    prov.includes("bsas") ||
    (cpNum >= 1600 && cpNum <= 1999) ||
    (cpNum >= 2700 && cpNum <= 2999) ||
    (cpNum >= 6000 && cpNum <= 8199)
  ) {
    return "buenos-aires";
  }
  return "resto-pais";
}

export const ORIGIN_POSTAL_CODE = "1428";
export const STANDARD_PACKAGE = { weight: 1000, height: 15, width: 20, length: 30 };

export function normalizePostalCode(cp: string) {
  const m = cp.toUpperCase().match(/\d{4}/);
  return m ? m[0] : "";
}

// ==========================================
// COTIZADOR INTELIGENTE CORREO ARGENTINO
// ==========================================

export type ShippingQuoteItem = {
  id: string;
  title: string;
  subtitle: string;
  carrier: "Correo Argentino" | "Rancho Viejo";
  price: number;
  estimatedTime: string;
  type: "domicilio" | "sucursal" | "retiro";
  badge?: string;
};

export type ShippingQuoteResult = {
  postalCode: string;
  location: string;
  province: string;
  items: ShippingQuoteItem[];
};

export function resolveLocationFromCP(cp: string): { location: string; province: string } {
  const digits = cp.replace(/\D/g, "");
  const num = parseInt(digits.slice(0, 4), 10);
  if (isNaN(num)) return { location: "Argentina", province: "Argentina" };

  if (num >= 1000 && num <= 1499) return { location: "Capital Federal (CABA)", province: "Capital Federal" };
  if (num >= 1600 && num <= 1899) return { location: "Gran Buenos Aires (GBA)", province: "Buenos Aires" };
  if (num >= 1900 && num <= 1999) return { location: "La Plata y alrededores", province: "Buenos Aires" };
  if (num >= 2000 && num <= 2999) return { location: "Rosario / Santa Fe / Norte Bs. As.", province: "Santa Fe / Buenos Aires" };
  if (num >= 3000 && num <= 3999) return { location: "Santa Fe / Entre Ríos / Corrientes / Misiones", province: "Litoral" };
  if (num >= 4000 && num <= 4999) return { location: "Tucumán / Salta / Jujuy / Sgo. del Estero", province: "Noroeste Argentino (NOA)" };
  if (num >= 5000 && num <= 5999) return { location: "Córdoba / La Rioja", province: "Córdoba" };
  if (num >= 6000 && num <= 7999) return { location: "Interior de Buenos Aires", province: "Buenos Aires" };
  if (num >= 8000 && num <= 8999) return { location: "Río Negro / Neuquén / Bahía Blanca", province: "Patagonia Norte" };
  if (num >= 9000 && num <= 9999) return { location: "Chubut / Santa Cruz / Tierra del Fuego", province: "Patagonia Sur" };
  return { location: "Interior de Argentina", province: "Argentina" };
}

export function calculateShippingQuote(postalCode: string): ShippingQuoteResult {
  const norm = normalizePostalCode(postalCode) || postalCode.replace(/\D/g, "").slice(0, 4);
  const num = parseInt(norm, 10);
  const loc = resolveLocationFromCP(norm);

  const items: ShippingQuoteItem[] = [];

  if (num >= 1000 && num <= 1499) {
    // CABA
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio",
      subtitle: "Entrega directa en tu puerta en Capital Federal",
      carrier: "Correo Argentino",
      price: 7000,
      estimatedTime: "Llega en 1 a 2 días hábiles",
      type: "domicilio",
      badge: "Más rápido",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 5200,
      estimatedTime: "Llega en 1 a 3 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if (num >= 1600 && num <= 1899) {
    // GBA
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio",
      subtitle: "Entrega directa en tu puerta en Gran Buenos Aires",
      carrier: "Correo Argentino",
      price: 10000,
      estimatedTime: "Llega en 2 a 3 días hábiles",
      type: "domicilio",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu localidad",
      carrier: "Correo Argentino",
      price: 7800,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if ((num >= 1900 && num <= 2999) || (num >= 6000 && num <= 8199)) {
    // Buenos Aires Interior
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio",
      subtitle: "Entrega a domicilio en provincia de Buenos Aires",
      carrier: "Correo Argentino",
      price: 10000,
      estimatedTime: "Llega en 3 a 5 días hábiles",
      type: "domicilio",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu ciudad",
      carrier: "Correo Argentino",
      price: 7800,
      estimatedTime: "Llega en 3 a 5 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else {
    // Resto del País (Interior / Patagonia / NOA / NEA / Cuyo / Centro)
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Despacho asegurado a domicilio a todo el país",
      carrier: "Correo Argentino",
      price: 18000,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 14500,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  }

  return {
    postalCode: norm,
    location: loc.location,
    province: loc.province,
    items,
  };
}
