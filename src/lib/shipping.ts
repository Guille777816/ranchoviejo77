// Configuración oficial y cotizador Correo Argentino - Rancho Viejo Mates
export type ShippingOptionId =
  | "caba"
  | "buenos-aires"
  | "santa-fe"
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
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 9492,
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires / GBA",
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 9492,
  },
  {
    id: "santa-fe",
    name: "Santa Fe / Rosario",
    description: "Envío clásico a domicilio regional por Correo Argentino (2 a 4 días)",
    price: 8220,
  },
  {
    id: "resto-pais",
    name: "Interior del país",
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 10335,
  },
  {
    id: "sucursal-correo",
    name: "Retiro en Sucursal Correo Argentino",
    description: "Retiro en la sucursal de Correo Argentino más cercana a tu domicilio",
    price: 6480,
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
  if (prov.includes("santa fe") || prov.includes("rosario") || (cpNum >= 2000 && cpNum <= 2999)) {
    return "santa-fe";
  }
  if (
    prov.includes("buenos aires") ||
    prov.includes("bs as") ||
    prov.includes("bsas") ||
    (cpNum >= 1600 && cpNum <= 1999) ||
    (cpNum >= 6000 && cpNum <= 8199)
  ) {
    return "buenos-aires";
  }
  return "resto-pais";
}

export const ORIGIN_POSTAL_CODE = "2000";
export const STANDARD_PACKAGE = { weight: 1000, height: 15, width: 20, length: 30 };

export function normalizePostalCode(cp: string) {
  const m = cp.toUpperCase().match(/\d{4}/);
  return m ? m[0] : "";
}

// ==========================================
// COTIZADOR INTELIGENTE CORREO ARGENTINO
// Tarifas oficiales sincronizadas con Empretienda
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
  if (num >= 2000 && num <= 2999) return { location: "Rosario / Santa Fe y zona", province: "Santa Fe" };
  if (num >= 3000 && num <= 3999) return { location: "Santa Fe / Entre Ríos / Corrientes / Misiones", province: "Litoral" };
  if (num >= 4000 && num <= 4999) return { location: "Tucumán / Salta / Jujuy / Sgo. del Estero", province: "Noroeste Argentino (NOA)" };
  if (num >= 5000 && num <= 5999) return { location: "Córdoba y zona centro", province: "Córdoba" };
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
    // CABA: Exacto Empretienda $9.492 domicilio / $6.480 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio Clásico",
      subtitle: "Entrega directa en tu puerta en Capital Federal",
      carrier: "Correo Argentino",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if (num >= 1600 && num <= 1999) {
    // GBA y La Plata: $9.492 domicilio / $6.480 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio Clásico",
      subtitle: "Entrega directa en tu puerta en Gran Buenos Aires / La Plata",
      carrier: "Correo Argentino",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu localidad",
      carrier: "Correo Argentino",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if (num >= 2000 && num <= 2999) {
    // Rosario / Santa Fe (Local Regional): $8.220 domicilio / $5.347 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio Clásico",
      subtitle: "Entrega a domicilio regional en Santa Fe / Rosario",
      carrier: "Correo Argentino",
      price: 8220,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "domicilio",
      badge: "Regional",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 5347,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if ((num >= 5000 && num <= 5999) || (num >= 6000 && num <= 7999) || (num >= 3000 && num <= 3999)) {
    // Córdoba, Interior Bs As, Litoral: $9.492 domicilio / $6.480 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio Clásico",
      subtitle: "Entrega a domicilio asegurada por Correo Argentino",
      carrier: "Correo Argentino",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu ciudad",
      carrier: "Correo Argentino",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else if (num >= 9000 && num <= 9999) {
    // Patagonia Sur / Tierra del Fuego / Ushuaia: $10.396 domicilio / $7.357 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío a Domicilio Clásico",
      subtitle: "Despacho aéreo y terrestre a domicilio a Patagonia Sur",
      carrier: "Correo Argentino",
      price: 10396,
      estimatedTime: "Llega en 4 a 7 días hábiles",
      type: "domicilio",
      badge: "Extrema",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 7357,
      estimatedTime: "Llega en 4 a 7 días hábiles",
      type: "sucursal",
      badge: "Económico",
    });
  } else {
    // Resto del País (NOA, Cuyo, Mendoza, Tucumán, etc.): $10.335 domicilio / $7.118 sucursal
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Despacho asegurado a domicilio a todo el país",
      carrier: "Correo Argentino",
      price: 10335,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      price: 7118,
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
