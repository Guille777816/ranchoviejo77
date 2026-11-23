// Configuración oficial y cotizador dinámico - Rancho Viejo Mates
// Origen: Venado Tuerto / Santa Fe (CP 2600)
// Los 3 mejores correos de Argentina: Correo Argentino, Andreani y OCA

export type ShippingCarrier = "Correo Argentino" | "Andreani" | "OCA" | "Rancho Viejo";

export type ShippingOptionId =
  | "caba"
  | "buenos-aires"
  | "santa-fe"
  | "resto-pais"
  | "sucursal-correo"
  | "andreani-domicilio"
  | "andreani-sucursal"
  | "oca-domicilio"
  | "oca-sucursal";

export type ShippingOption = {
  id: ShippingOptionId;
  name: string;
  description: string;
  price: number;
  carrier?: ShippingCarrier;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "caba",
    name: "Correo Argentino — Envío Clásico a Domicilio (CABA)",
    description: "Entrega clásica a domicilio por Correo Argentino (3 a 6 días)",
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
    name: "Correo Argentino — Santa Fe y Región",
    description: "Envío clásico regional a domicilio por Correo Argentino (2 a 4 días)",
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
    id: "andreani-domicilio",
    name: "Andreani — Envío a Domicilio Express",
    description: "Entrega puerta a puerta más rápida por Andreani (1 a 3 días)",
    price: 9998,
    carrier: "Andreani",
  },
  {
    id: "andreani-sucursal",
    name: "Andreani — Retiro en Sucursal",
    description: "Retiro en la sucursal Andreani más cercana",
    price: 5904,
    carrier: "Andreani",
  },
  {
    id: "oca-domicilio",
    name: "OCA — Envío Estándar a Domicilio",
    description: "Entrega a domicilio por OCA (2 a 4 días)",
    price: 9650,
    carrier: "OCA",
  },
  {
    id: "oca-sucursal",
    name: "OCA — Retiro en Sucursal",
    description: "Retiro en la sucursal OCA más cercana",
    price: 6200,
    carrier: "OCA",
  },
];

export function getShippingOption(id: string): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

export const ORIGIN_POSTAL_CODE = "2600"; // Venado Tuerto / Santa Fe

// ==========================================
// DIMENSIONES DE EMBALAJE Y CÁLCULO
// ==========================================

export interface ShippingDimensions {
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  declaredValueCents?: number;
}

export const DEFAULT_SHIPPING_DIMENSIONS: ShippingDimensions = {
  weightGrams: 450, // 450g estándar de un mate artesanal o combo
  heightCm: 15,
  widthCm: 12,
  lengthCm: 12,
};

export function extractShippingDimensions(
  specifications: unknown,
  fallbackPriceCents?: number
): ShippingDimensions {
  const result: ShippingDimensions = {
    ...DEFAULT_SHIPPING_DIMENSIONS,
    declaredValueCents: fallbackPriceCents || 0,
  };

  if (Array.isArray(specifications)) {
    for (const item of specifications as Array<{ label?: string; value?: string }>) {
      if (!item || typeof item.label !== "string") continue;
      const label = item.label.toLowerCase().trim();
      const val = item.value || "";
      const num = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
      if (isNaN(num)) continue;

      if (label.includes("peso")) {
        if (val.toLowerCase().includes("kg") && num < 50) {
          result.weightGrams = Math.round(num * 1000);
        } else {
          result.weightGrams = Math.round(num);
        }
      } else if (label === "alto" || label === "altura") {
        result.heightCm = Math.round(num);
      } else if (label === "ancho") {
        result.widthCm = Math.round(num);
      } else if (label === "largo" || label === "profundidad") {
        result.lengthCm = Math.round(num);
      } else if (label.includes("valor declarado") || label === "declarado") {
        result.declaredValueCents = Math.round(num * 100);
      }
    }
  }

  return result;
}

export function mergeShippingDimensionsIntoSpecs(
  existingSpecs: Array<{ label: string; value: string }>,
  dims: ShippingDimensions
): Array<{ label: string; value: string }> {
  const clean = existingSpecs.filter((s) => {
    const l = s.label.toLowerCase().trim();
    return !["peso", "alto", "altura", "ancho", "largo", "dimensiones", "valor declarado"].includes(l);
  });

  clean.push(
    { label: "Peso", value: `${dims.weightGrams} g` },
    { label: "Altura", value: `${dims.heightCm} cm` },
    { label: "Ancho", value: `${dims.widthCm} cm` },
    { label: "Largo", value: `${dims.lengthCm} cm` },
  );

  if (dims.declaredValueCents && dims.declaredValueCents > 0) {
    clean.push({
      label: "Valor declarado",
      value: `$ ${Math.round(dims.declaredValueCents / 100).toLocaleString("es-AR")}`,
    });
  }

  return clean;
}

export function normalizePostalCode(cp: string) {
  const m = cp.toUpperCase().match(/\d{4}/);
  return m ? m[0] : "";
}

export type ShippingQuoteItem = {
  id: string;
  title: string;
  subtitle: string;
  carrier: ShippingCarrier;
  logoUrl: string;
  price: number;
  estimatedTime: string;
  type: "domicilio" | "sucursal";
  badge?: string;
  badgeColor?: "blue" | "amber" | "green";
};

export type ShippingQuoteResult = {
  postalCode: string;
  location: string;
  province: string;
  items: ShippingQuoteItem[];
  packageDetails: {
    quantity: number;
    totalWeightKg: number;
    volumetricWeightKg: number;
    billableWeightKg: number;
    declaredValue: number;
  };
};

export function resolveLocationFromCP(cp: string): { location: string; province: string; zone: "local" | "regional" | "caba" | "gba" | "interior" | "patagonia" } {
  const digits = cp.replace(/\D/g, "");
  const num = parseInt(digits.slice(0, 4), 10);
  if (isNaN(num)) return { location: "Argentina", province: "Argentina", zone: "interior" };

  if (num === 2600) return { location: "Venado Tuerto (Santa Fe)", province: "Santa Fe", zone: "local" };
  if (num >= 1000 && num <= 1499) return { location: "Capital Federal (CABA)", province: "Capital Federal", zone: "caba" };
  if (num >= 1600 && num <= 1899) return { location: "Gran Buenos Aires (GBA)", province: "Buenos Aires", zone: "gba" };
  if (num >= 1900 && num <= 1999) return { location: "La Plata y alrededores", province: "Buenos Aires", zone: "gba" };
  if (num >= 2000 && num <= 2999) return { location: "Santa Fe y zona (Rosario, Rafaela)", province: "Santa Fe", zone: "regional" };
  if (num >= 3000 && num <= 3999) return { location: "Santa Fe / Entre Ríos / Corrientes", province: "Litoral", zone: "regional" };
  if (num >= 5000 && num <= 5999) return { location: "Córdoba y zona centro", province: "Córdoba", zone: "regional" };
  if (num >= 6000 && num <= 6999) return { location: "Buenos Aires (Noroeste)", province: "Buenos Aires", zone: "regional" };
  if (num >= 4000 && num <= 4999) return { location: "Tucumán / Salta / Jujuy / Sgo. del Estero", province: "NOA", zone: "interior" };
  if (num >= 7000 && num <= 7999) return { location: "Mar del Plata / Costa Atlántica / Centro", province: "Buenos Aires", zone: "interior" };
  if (num >= 8000 && num <= 8999) return { location: "Río Negro / Neuquén / Bahía Blanca", province: "Patagonia Norte", zone: "patagonia" };
  if (num >= 9000 && num <= 9999) return { location: "Chubut / Santa Cruz / Tierra del Fuego", province: "Patagonia Sur", zone: "patagonia" };
  return { location: "Interior de Argentina", province: "Argentina", zone: "interior" };
}

export interface CalculateShippingParams {
  postalCode: string;
  dimensions?: Partial<ShippingDimensions>;
  quantity?: number;
  productPriceCents?: number;
}

export function calculateShippingQuote(
  postalCodeOrParams: string | CalculateShippingParams
): ShippingQuoteResult {
  let postalCode = "";
  let dimensions: ShippingDimensions = { ...DEFAULT_SHIPPING_DIMENSIONS };
  let quantity = 1;
  let productPriceCents = 0;

  if (typeof postalCodeOrParams === "string") {
    postalCode = postalCodeOrParams;
  } else {
    postalCode = postalCodeOrParams.postalCode;
    if (postalCodeOrParams.dimensions) {
      dimensions = { ...DEFAULT_SHIPPING_DIMENSIONS, ...postalCodeOrParams.dimensions };
    }
    quantity = Math.max(1, postalCodeOrParams.quantity || 1);
    productPriceCents = postalCodeOrParams.productPriceCents || dimensions.declaredValueCents || 0;
  }

  const norm = normalizePostalCode(postalCode);
  const { location, province, zone } = resolveLocationFromCP(norm);

  // 1. Cálculo físico y aforo
  const singleWeightKg = (dimensions.weightGrams || 450) / 1000;
  const totalPhysicalWeightKg = Number((singleWeightKg * quantity).toFixed(2));

  // Volumen consolidado (empaque con coeficiente de eficiencia al apilar)
  const singleVolumeCm3 = (dimensions.heightCm || 15) * (dimensions.widthCm || 12) * (dimensions.lengthCm || 12);
  const totalVolumeCm3 = quantity === 1 ? singleVolumeCm3 : singleVolumeCm3 * quantity * 0.88;
  const volumetricWeightKg = Number((totalVolumeCm3 / 4000).toFixed(2));

  // Peso facturable por los correos: el mayor entre peso real y aforo
  const billableWeightKg = Math.max(0.4, totalPhysicalWeightKg, volumetricWeightKg);

  // 2. Factor de escala por peso facturable (Base: hasta 1kg)
  let weightFactor = 1.0;
  if (billableWeightKg <= 1.0) {
    weightFactor = 1.0;
  } else if (billableWeightKg <= 2.0) {
    weightFactor = 1.25;
  } else if (billableWeightKg <= 3.0) {
    weightFactor = 1.45;
  } else if (billableWeightKg <= 5.0) {
    weightFactor = 1.75;
  } else if (billableWeightKg <= 10.0) {
    weightFactor = 2.25;
  } else if (billableWeightKg <= 15.0) {
    weightFactor = 2.80;
  } else {
    weightFactor = 2.80 + (billableWeightKg - 15) * 0.12;
  }

  // 3. Seguro por valor declarado
  const declaredValue = Math.round(
    ((dimensions.declaredValueCents && dimensions.declaredValueCents > 0
      ? dimensions.declaredValueCents
      : productPriceCents > 0
      ? productPriceCents
      : 3500000) *
      quantity) /
      100
  );

  // Seguro al 0.8% si supera la cobertura básica de $25.000
  const insuranceExtra = declaredValue > 25000 ? Math.round((declaredValue - 25000) * 0.008) : 0;

  // 4. Tarifas base (hasta 1kg) de los 3 mejores correos por zona desde Venado Tuerto (CP 2600)
  type BaseRates = {
    caSucursal: number;
    caDomicilio: number;
    anSucursal: number;
    anDomicilio: number;
    ocaSucursal: number;
    ocaDomicilio: number;
    caTime: string;
    anTime: string;
    ocaTime: string;
  };

  const tariffMap: Record<string, BaseRates> = {
    local: {
      caSucursal: 4900,
      caDomicilio: 6500,
      anSucursal: 4600,
      anDomicilio: 7200,
      ocaSucursal: 4800,
      ocaDomicilio: 6900,
      caTime: "Llega en 24 a 48 hs",
      anTime: "Llega en 24 hs hábiles",
      ocaTime: "Llega en 24 a 48 hs",
    },
    regional: {
      caSucursal: 6480,
      caDomicilio: 8220,
      anSucursal: 5904,
      anDomicilio: 8950,
      ocaSucursal: 6150,
      ocaDomicilio: 8600,
      caTime: "Llega en 2 a 4 días hábiles",
      anTime: "Llega en 1 a 3 días hábiles",
      ocaTime: "Llega en 2 a 3 días hábiles",
    },
    caba: {
      caSucursal: 6480,
      caDomicilio: 9492,
      anSucursal: 5904,
      anDomicilio: 9998,
      ocaSucursal: 6200,
      ocaDomicilio: 9650,
      caTime: "Llega en 3 a 5 días hábiles",
      anTime: "Llega en 1 a 2 días hábiles",
      ocaTime: "Llega en 2 a 4 días hábiles",
    },
    gba: {
      caSucursal: 6480,
      caDomicilio: 9492,
      anSucursal: 5904,
      anDomicilio: 9998,
      ocaSucursal: 6200,
      ocaDomicilio: 9650,
      caTime: "Llega en 3 a 6 días hábiles",
      anTime: "Llega en 1 a 3 días hábiles",
      ocaTime: "Llega en 2 a 4 días hábiles",
    },
    interior: {
      caSucursal: 7118,
      caDomicilio: 10335,
      anSucursal: 7450,
      anDomicilio: 11800,
      ocaSucursal: 7300,
      ocaDomicilio: 11200,
      caTime: "Llega en 3 a 6 días hábiles",
      anTime: "Llega en 2 a 4 días hábiles",
      ocaTime: "Llega en 3 a 5 días hábiles",
    },
    patagonia: {
      caSucursal: 7357,
      caDomicilio: 10396,
      anSucursal: 8900,
      anDomicilio: 13500,
      ocaSucursal: 8500,
      ocaDomicilio: 12900,
      caTime: "Llega en 4 a 7 días hábiles",
      anTime: "Llega en 3 a 5 días hábiles",
      ocaTime: "Llega en 4 a 6 días hábiles",
    },
  };

  const rates = tariffMap[zone] || tariffMap.interior;

  const items: ShippingQuoteItem[] = [
    // 1. CORREO ARGENTINO - SUCURSAL
    {
      id: "ca-sucursal",
      title: "Correo Argentino — Retiro en Sucursal",
      subtitle: `Retiro en sucursal más cercana (${location})`,
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: Math.round(rates.caSucursal * weightFactor + insuranceExtra),
      estimatedTime: rates.caTime,
      type: "sucursal",
      badge: "Económico",
      badgeColor: "amber",
    },
    // 2. CORREO ARGENTINO - DOMICILIO
    {
      id: "ca-domicilio",
      title: "Correo Argentino — Envío Clásico a Domicilio",
      subtitle: `Entrega directa en tu puerta en ${location}`,
      carrier: "Correo Argentino",
      logoUrl: "/images/carriers/correo-argentino.png",
      price: Math.round(rates.caDomicilio * weightFactor + insuranceExtra),
      estimatedTime: rates.caTime,
      type: "domicilio",
      badge: "Clásico",
      badgeColor: "amber",
    },
    // 3. ANDREANI - SUCURSAL
    {
      id: "an-sucursal",
      title: "Andreani — Retiro en Sucursal",
      subtitle: "Retiro ágil en la sucursal Andreani de tu ciudad",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: Math.round(rates.anSucursal * weightFactor + insuranceExtra),
      estimatedTime: rates.anTime,
      type: "sucursal",
      badge: "Express Sucursal",
      badgeColor: "blue",
    },
    // 4. ANDREANI - DOMICILIO
    {
      id: "an-domicilio",
      title: "Andreani — Envío Express a Domicilio",
      subtitle: "Entrega prioritaria y seguimiento en vivo por Andreani",
      carrier: "Andreani",
      logoUrl: "/images/carriers/andreani.png",
      price: Math.round(rates.anDomicilio * weightFactor + insuranceExtra),
      estimatedTime: rates.anTime,
      type: "domicilio",
      badge: "Más Rápido",
      badgeColor: "blue",
    },
    // 5. OCA - SUCURSAL
    {
      id: "oca-sucursal",
      title: "OCA — Retiro en Sucursal",
      subtitle: "Retiro en la red de sucursales OCA",
      carrier: "OCA",
      logoUrl: "/images/carriers/oca.svg",
      price: Math.round(rates.ocaSucursal * weightFactor + insuranceExtra),
      estimatedTime: rates.ocaTime,
      type: "sucursal",
      badge: "Red Nacional",
      badgeColor: "amber",
    },
    // 6. OCA - DOMICILIO
    {
      id: "oca-domicilio",
      title: "OCA — Envío Estándar a Domicilio",
      subtitle: "Despacho asegurado puerta a puerta por OCA",
      carrier: "OCA",
      logoUrl: "/images/carriers/oca.svg",
      price: Math.round(rates.ocaDomicilio * weightFactor + insuranceExtra),
      estimatedTime: rates.ocaTime,
      type: "domicilio",
      badge: "Estándar",
      badgeColor: "amber",
    },
  ];

  // Marcar automáticamente la opción más barata con badge verde
  let lowestIdx = 0;
  for (let i = 1; i < items.length; i++) {
    if (items[i].price < items[lowestIdx].price) {
      lowestIdx = i;
    }
  }
  items[lowestIdx].badge = "Mejor Precio";
  items[lowestIdx].badgeColor = "green";

  return {
    postalCode: norm,
    location,
    province,
    items,
    packageDetails: {
      quantity,
      totalWeightKg: totalPhysicalWeightKg,
      volumetricWeightKg,
      billableWeightKg,
      declaredValue,
    },
  };
}
