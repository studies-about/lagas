const KEY = "lagas_route";

export interface RouteData {
  name: string;
  distancia: number; // km
  desnivel: number;  // m D+
  tiempo: string;    // formatted "Xh Ym"
  source: "manual" | "strava";
  fecha?: string;    // ISO date "YYYY-MM-DD"
  hora?: string;     // "HH:MM"
}

export function saveRoute(data: RouteData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getRoute(): RouteData | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearRoute() {
  localStorage.removeItem(KEY);
}

// ─── kit config ──────────────────────────────────────────────────────────────

export type CarbTarget = "45-60 g/h" | "60-90 g/h" | "90+ g/h";

const KIT_KEY = "lagas_kit_config";

export function saveKitConfig(carbTarget: CarbTarget) {
  localStorage.setItem(KIT_KEY, JSON.stringify({ carbTarget }));
}

export function getKitConfig(): CarbTarget {
  const raw = localStorage.getItem(KIT_KEY);
  if (!raw) return "60-90 g/h";
  try { return (JSON.parse(raw) as { carbTarget: CarbTarget }).carbTarget; } catch { return "60-90 g/h"; }
}

export const carbRates: Record<CarbTarget, number> = {
  "45-60 g/h": 52,
  "60-90 g/h": 75,
  "90+ g/h": 100,
};

// ─── kit calculation (shared) ─────────────────────────────────────────────────

export type KitItem = { name: string; qty: string; weight: number; storage: "llevar" | "ruta" };

export function buildSectionItems(sectionKm: number, sectionDesnivel: number, carbTarget: CarbTarget): KitItem[] {
  const sectionHours = sectionKm / 28 + sectionDesnivel / 800;
  let carbsLeft = carbRates[carbTarget] * sectionHours;
  const items: KitItem[] = [];

  items.push({ name: "Bidón isotónico", qty: "750 ml", weight: 750, storage: "llevar" });
  carbsLeft -= 45;

  const gels = Math.max(1, Math.round(carbsLeft / 22));
  if (sectionHours >= 2 && gels >= 2) {
    const caf = Math.max(1, Math.floor(gels / 2));
    const malt = gels - caf;
    if (malt > 0) items.push({ name: "Gel de maltodextrina", qty: `${malt}x`, weight: malt * 40, storage: "llevar" });
    items.push({ name: "Gel de cafeína", qty: `${caf}x`, weight: caf * 40, storage: "llevar" });
  } else {
    items.push({ name: "Gel de maltodextrina", qty: `${gels}x`, weight: gels * 40, storage: "llevar" });
  }
  carbsLeft -= gels * 22;

  if (carbsLeft > 25) {
    const bars = Math.ceil(carbsLeft / 35);
    const itemName = sectionHours >= 3 ? "Barrita de arroz" : "Barrita energética";
    const itemWeight = sectionHours >= 3 ? 45 : 50;
    items.push({ name: itemName, qty: `${bars}x`, weight: bars * itemWeight, storage: "llevar" });
  }

  if (sectionKm > 80) {
    items.push({ name: "Plátano (en control)", qty: "1x", weight: 0, storage: "ruta" });
  }

  return items;
}

// ─── shared helpers ──────────────────────────────────────────────────────────

export function estimarTiempo(km: number, desnivel: number): string {
  if (km === 0) return "—";
  const h = km / 28 + desnivel / 800;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h${mm > 0 ? ` ${mm}m` : ""}`;
}

export function generarSecciones(km: number) {
  const num = km <= 70 ? 2 : km <= 150 ? 3 : km <= 250 ? 4 : 5;
  const base = Math.floor(km / num);
  return Array.from({ length: num }, (_, i) => ({
    id: i + 1,
    km: i === num - 1 ? km - base * i : base,
  }));
}
