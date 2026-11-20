// Configuración oficial y cotizador multilogística - Rancho Viejo Mates
// Andreani, Correo Argentino y Vía Cargo

export type ShippingCarrier = "Andreani" | "Correo Argentino" | "Vía Cargo" | "Rancho Viejo";

export type ShippingOptionId =
  | "caba"
  | "buenos-aires"
  | "santa-fe"
  | "resto-pais"
  | "sucursal-correo"
  | "andreani-domicilio"
  | "andreani-sucursal"
  | "viacargo-terminal";

export type ShippingOption = {
  id: ShippingOptionId;
  name: string;
  description: string;
  price: number;
  carrier?: ShippingCarrier;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "andreani-domicilio",
    name: "Andreani — Envío a Domicilio",
    description: "Entrega puerta a puerta más rápida por Andreani (1 a 3 días)",
    price: 9998,
    carrier: "Andreani",
  },
  {
    id: "caba",
    name: "Correo Argentino — Capital Federal (CABA)",
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 9492,
    carrier: "Correo Argentino",
  },
  {
    id: "buenos-aires",
    name: "Correo Argentino — Buenos Aires / GBA",
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 9492,
    carrier: "Correo Argentino",
  },
  {
    id: "santa-fe",
    name: "Correo Argentino — Santa Fe / Rosario",
    description: "Envío clásico a domicilio regional por Correo Argentino (2 a 4 días)",
    price: 8220,
    carrier: "Correo Argentino",
  },
  {
    id: "resto-pais",
    name: "Correo Argentino — Interior del país",
    description: "Envío clásico a domicilio por Correo Argentino (3 a 6 días)",
    price: 10335,
    carrier: "Correo Argentino",
  },
  {
    id: "sucursal-correo",
    name: "Correo Argentino — Retiro en Sucursal",
    description: "Retiro en la sucursal de Correo Argentino más cercana a tu domicilio",
    price: 6480,
    carrier: "Correo Argentino",
  },
  {
    id: "andreani-sucursal",
    name: "Andreani — Retiro en Sucursal",
    description: "Retiro en la sucursal Andreani más cercana",
    price: 5904,
    carrier: "Andreani",
  },
  {
    id: "viacargo-terminal",
    name: "Vía Cargo — Encomienda a Terminal / Agencia",
    description: "Despacho por Vía Cargo ideal para pedidos mayoristas de mates y bultos grandes",
    price: 7200,
    carrier: "Vía Cargo",
  },
];

export function getShippingOption(id: string): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

export const ORIGIN_POSTAL_CODE = "2000"; // Rosario / Santa Fe
export const STANDARD_PACKAGE = { weight: 1000, height: 15, width: 20, length: 30 };

export function normalizePostalCode(cp: string) {
  const m = cp.toUpperCase().match(/\d{4}/);
  return m ? m[0] : "";
}

// ==========================================
// COTIZADOR MULTILOGÍSTICA
// Andreani + Correo Argentino + Vía Cargo
// ==========================================

export type ShippingQuoteItem = {
  id: string;
  title: string;
  subtitle: string;
  carrier: ShippingCarrier;
  logoUrl: string;
  price: number;
  priceNote?: string;
  estimatedTime: string;
  type: "domicilio" | "sucursal" | "terminal";
  badge?: string;
  badgeColor?: "blue" | "amber" | "green" | "emerald";
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
  const norm = normalizePostalCode(postalCode);
  const num = parseInt(norm, 10);
  const { location, province } = resolveLocationFromCP(norm);

  const items: ShippingQuoteItem[] = [];

  // 1. CABA (1000 - 1499)
  if (num >= 1000 && num <= 1499) {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío a Domicilio",
      subtitle: "Entrega directa y seguimiento express en Capital Federal",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 9998,
      estimatedTime: "Llega en 1 a 3 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Entrega directa en tu puerta en Capital Federal",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal Andreani más cercana a tu dirección",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 5904,
      estimatedTime: "Llega en 1 a 3 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu barrio",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Retiro en agencias y terminales Vía Cargo en CABA. Ideal bultos grandes",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 7200,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });

  // 2. GBA y La Plata (1600 - 1999)
  } else if (num >= 1600 && num <= 1999) {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío a Domicilio",
      subtitle: "Entrega prioritaria a domicilio en Gran Buenos Aires / La Plata",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 9998,
      estimatedTime: "Llega en 1 a 3 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Entrega directa en tu puerta en GBA / La Plata",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en sucursal Andreani de tu localidad",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 5904,
      estimatedTime: "Llega en 1 a 3 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en sucursal Correo Argentino de tu localidad",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Retiro en agencias Vía Cargo de tu zona. Recomendado compras mayoristas",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 7200,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });

  // 3. Rosario / Santa Fe y zona (2000 - 2999) - Regional
  } else if (num >= 2000 && num <= 2999) {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío Regional a Domicilio",
      subtitle: "Despacho directo desde origen en Rosario / Santa Fe",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 7850,
      estimatedTime: "Llega en 1 a 2 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Regional a Domicilio",
      subtitle: "Entrega regional asegurada en Santa Fe / Rosario",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 8220,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "domicilio",
      badge: "Regional",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en sucursal Andreani más cercana en la región",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 4950,
      estimatedTime: "Llega en 1 a 2 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 5347,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Retiro en agencias y terminales Vía Cargo de Santa Fe",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 5800,
      estimatedTime: "Llega en 1 a 2 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });

  // 4. Córdoba, Interior Bs As, Litoral (3000-3999, 5000-7999)
  } else if ((num >= 5000 && num <= 5999) || (num >= 6000 && num <= 7999) || (num >= 3000 && num <= 3999)) {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío a Domicilio",
      subtitle: "Entrega rápida a domicilio en Córdoba, Litoral e Interior",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 10500,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Entrega a domicilio asegurada por Correo Argentino",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 9492,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal Andreani de tu ciudad",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 6400,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino de tu ciudad",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 6480,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Retiro en terminal de ómnibus o agencia Vía Cargo oficial",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 7500,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });

  // 5. Patagonia Sur (9000 - 9999)
  } else if (num >= 9000 && num <= 9999) {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío Express a Domicilio",
      subtitle: "Transporte aéreo y terrestre prioritario a Patagonia Sur",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 13500,
      estimatedTime: "Llega en 3 a 5 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Despacho aéreo y terrestre a domicilio a Patagonia Sur",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 10396,
      estimatedTime: "Llega en 4 a 7 días hábiles",
      type: "domicilio",
      badge: "Extrema",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en sucursal Andreani más cercana en el sur",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 8900,
      estimatedTime: "Llega en 3 a 5 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 7357,
      estimatedTime: "Llega en 4 a 7 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Despacho a terminales Vía Cargo en Patagonia Sur",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 9800,
      estimatedTime: "Llega en 4 a 6 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });

  // 6. Resto del País (NOA, Cuyo, Mendoza, Tucumán, etc.)
  } else {
    items.push({
      id: "an-domicilio",
      title: "Andreani — Envío a Domicilio",
      subtitle: "Entrega express a domicilio a todo el país",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 11800,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: "Despacho asegurado a domicilio a todo el país",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 10335,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "domicilio",
      badge: "Clásico",
      badgeColor: "amber",
    });
    items.push({
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal Andreani de tu ciudad",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: 7450,
      estimatedTime: "Llega en 2 a 4 días hábiles",
      type: "sucursal",
      badge: "Económico Express",
      badgeColor: "blue",
    });
    items.push({
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: "Retiro en la sucursal de Correo Argentino más cercana",
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: 7118,
      estimatedTime: "Llega en 3 a 6 días hábiles",
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    });
    items.push({
      id: "vc-terminal",
      title: "Vía Cargo — Encomienda a Terminal / Agencia",
      subtitle: "Retiro en terminal de ómnibus o agencias Vía Cargo de tu provincia",
      carrier: "Vía Cargo",
      logoUrl: "/images/carriers/viacargo.png",
      price: 8400,
      estimatedTime: "Llega en 3 a 5 días hábiles",
      type: "terminal",
      badge: "Mayorista",
      badgeColor: "emerald",
    });
  }

  return {
    postalCode: norm,
    location,
    province,
    items,
  };
}
