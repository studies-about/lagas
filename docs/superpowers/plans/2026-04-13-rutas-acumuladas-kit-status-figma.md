# Rutas Acumuladas, Kit Status y Export Figma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acumular múltiples rutas en Home ordenadas por fecha, mostrar badge dinámico de progreso de compras por ruta, y exportar todas las páginas a un archivo Figma nuevo en 470×870px.

**Architecture:** `routeStore.ts` pasa a manejar un array de rutas con IDs únicos y un store de progreso de compras. Dashboard lee el array y muestra la más próxima con opción de expandir. Compras persiste el progreso por `routeId`. El export a Figma usa el MCP de Figma para crear un archivo nuevo con frames por página.

**Tech Stack:** React 18, TypeScript, Vite, localStorage, Vitest, Figma MCP

---

## Archivos a modificar / crear

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `src/lib/routeStore.ts` | Modificar | Array de rutas, IDs, progreso compras |
| `src/lib/routeStore.test.ts` | Crear | Tests unitarios del store |
| `src/pages/Dashboard.tsx` | Modificar | Lista rutas, expandir, badge dinámico |
| `src/pages/Compras.tsx` | Modificar | Guardar progreso al hacer toggle |

---

## Task 1: Extender routeStore con array de rutas e IDs

**Files:**
- Modify: `src/lib/routeStore.ts`
- Create: `src/lib/routeStore.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `src/lib/routeStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveRoute,
  getRoute,
  getRoutes,
  getRoutesSorted,
  setActiveRoute,
  deleteRoute,
  clearRoute,
} from "@/lib/routeStore";

beforeEach(() => {
  localStorage.clear();
});

describe("multi-route store", () => {
  it("saveRoute assigns an id", () => {
    const r = saveRoute({ name: "Ruta A", distancia: 100, desnivel: 1000, tiempo: "3h", source: "manual" });
    expect(r.id).toBeTruthy();
  });

  it("saveRoute acumula rutas en array", () => {
    saveRoute({ name: "A", distancia: 80, desnivel: 500, tiempo: "2h", source: "manual" });
    saveRoute({ name: "B", distancia: 120, desnivel: 800, tiempo: "4h", source: "manual" });
    expect(getRoutes()).toHaveLength(2);
  });

  it("getRoutesSorted ordena por fecha ascendente", () => {
    saveRoute({ name: "Tarde", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual", fecha: "2026-04-20", hora: "14:00" });
    saveRoute({ name: "Temprano", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual", fecha: "2026-04-15", hora: "08:00" });
    const sorted = getRoutesSorted();
    expect(sorted[0].name).toBe("Temprano");
    expect(sorted[1].name).toBe("Tarde");
  });

  it("rutas sin fecha van al final", () => {
    saveRoute({ name: "Sin fecha", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual" });
    saveRoute({ name: "Con fecha", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual", fecha: "2026-04-15" });
    const sorted = getRoutesSorted();
    expect(sorted[0].name).toBe("Con fecha");
    expect(sorted[1].name).toBe("Sin fecha");
  });

  it("setActiveRoute escribe la ruta activa", () => {
    const r = saveRoute({ name: "A", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual" });
    const r2 = saveRoute({ name: "B", distancia: 100, desnivel: 0, tiempo: "3h", source: "manual" });
    setActiveRoute(r2);
    expect(getRoute()?.name).toBe("B");
  });

  it("deleteRoute elimina del array", () => {
    const r = saveRoute({ name: "A", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual" });
    deleteRoute(r.id);
    expect(getRoutes()).toHaveLength(0);
  });

  it("deleteRoute limpia la ruta activa si era la eliminada", () => {
    const r = saveRoute({ name: "A", distancia: 80, desnivel: 0, tiempo: "2h", source: "manual" });
    setActiveRoute(r);
    deleteRoute(r.id);
    expect(getRoute()).toBeNull();
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
cd /Users/nicolas/Documents/Claude/Projects/lagas
bun test src/lib/routeStore.test.ts
```

Esperado: FAIL — `getRoutes is not a function` (o similar)

- [ ] **Step 3: Actualizar routeStore.ts**

Reemplazar el contenido completo de `src/lib/routeStore.ts`:

```typescript
const KEY = "lagas_route";
const ROUTES_KEY = "lagas_routes";

export interface RouteData {
  id: string;
  name: string;
  distancia: number;
  desnivel: number;
  tiempo: string;
  source: "manual" | "strava";
  fecha?: string;
  hora?: string;
}

// ─── ruta activa (para Kit, Calculadora, Compras) ─────────────────────────

export function getRoute(): RouteData | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setActiveRoute(route: RouteData) {
  localStorage.setItem(KEY, JSON.stringify(route));
}

export function clearRoute() {
  localStorage.removeItem(KEY);
}

// ─── array de rutas ──────────────────────────────────────────────────────

export function getRoutes(): RouteData[] {
  const raw = localStorage.getItem(ROUTES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function getRoutesSorted(): RouteData[] {
  return [...getRoutes()].sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    const da = new Date(`${a.fecha}T${a.hora ?? "00:00"}`).getTime();
    const db = new Date(`${b.fecha}T${b.hora ?? "00:00"}`).getTime();
    return da - db;
  });
}

export function saveRoute(data: Omit<RouteData, "id"> & { id?: string }): RouteData {
  const route: RouteData = { ...data, id: data.id ?? crypto.randomUUID() };
  // Actualizar array
  const routes = getRoutes();
  const idx = routes.findIndex(r => r.id === route.id);
  if (idx >= 0) routes[idx] = route;
  else routes.push(route);
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  // Setear como ruta activa
  setActiveRoute(route);
  return route;
}

export function deleteRoute(id: string) {
  const routes = getRoutes().filter(r => r.id !== id);
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  const active = getRoute();
  if (active?.id === id) clearRoute();
}

// ─── kit config ──────────────────────────────────────────────────────────

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

// ─── kit calculation ─────────────────────────────────────────────────────

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

// ─── helpers ─────────────────────────────────────────────────────────────

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

// ─── compras progress ────────────────────────────────────────────────────

const COMPRAS_KEY = "lagas_compras_status";

export interface ComprasStatus {
  checked: number;
  total: number;
}

export function saveComprasProgress(routeId: string, checked: number, total: number) {
  const raw = localStorage.getItem(COMPRAS_KEY);
  const all: Record<string, ComprasStatus> = raw ? JSON.parse(raw) : {};
  all[routeId] = { checked, total };
  localStorage.setItem(COMPRAS_KEY, JSON.stringify(all));
}

export function getComprasStatus(routeId: string): ComprasStatus | null {
  const raw = localStorage.getItem(COMPRAS_KEY);
  if (!raw) return null;
  try {
    const all: Record<string, ComprasStatus> = JSON.parse(raw);
    return all[routeId] ?? null;
  } catch { return null; }
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

```bash
bun test src/lib/routeStore.test.ts
```

Esperado: PASS — 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/routeStore.ts src/lib/routeStore.test.ts
git commit -m "feat: routeStore multi-ruta con ids, sorted, compras progress"
```

---

## Task 2: Dashboard — rutas acumuladas + badge dinámico

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Reemplazar Dashboard.tsx completo**

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { Bike, MapPin, Mountain, Clock, Package, ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  getRoutesSorted, setActiveRoute, RouteData,
  buildSectionItems, generarSecciones, getKitConfig,
  getComprasStatus,
} from "@/lib/routeStore";

function calcTotal(route: RouteData): number {
  const secciones = generarSecciones(route.distancia);
  return secciones.reduce((acc, s) => {
    const desnivel = Math.round(route.desnivel * (s.km / route.distancia));
    return acc + buildSectionItems(s.km, desnivel, getKitConfig())
      .filter(i => i.storage === "llevar").length;
  }, 0);
}

function KitBadge({ route }: { route: RouteData }) {
  if (!route.id) return null;
  const status = getComprasStatus(route.id);
  const total = calcTotal(route);
  if (!status || status.checked === 0) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
        0/{total} · Sin iniciar
      </span>
    );
  }
  if (status.checked >= status.total) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent font-medium">
        ✓ Completo
      </span>
    );
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium">
      {status.checked}/{status.total} · En progreso
    </span>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const routes = getRoutesSorted();
  const [expanded, setExpanded] = useState(false);

  const next = routes[0] ?? null;
  const rest = routes.slice(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">LAGAS</h1>
        <p className="text-xs text-muted-foreground">Tu nutrición para cada salida</p>
      </motion.div>

      {/* Card 1: Próxima Salida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {next ? (
          <>
            <div className="gradient-dark p-4">
              <h2 className="text-primary-foreground font-bold text-sm mb-1">Próxima Salida</h2>
              <p className="text-primary-foreground/90 text-sm font-medium">{next.name}</p>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.distancia} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.desnivel.toLocaleString("es-CL")} m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.tiempo}</span>
                </div>
              </div>
              {next.fecha && (
                <p className="text-primary-foreground/50 text-xs mt-1">
                  {next.fecha}{next.hora ? ` · ${next.hora}` : ""}
                </p>
              )}
              <div className="mt-3">
                <KitBadge route={next} />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setActiveRoute(next); navigate("/kit"); }}
                className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Armar kit para esta salida <ArrowRight className="w-4 h-4" />
              </button>

              {rest.length > 0 && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1"
                >
                  {expanded ? "Ocultar" : `y ${rest.length} más`}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="divide-y divide-border/50">
                    {rest.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setActiveRoute(r); navigate("/kit"); }}
                        className="w-full px-4 py-3 flex items-center gap-3 active:bg-muted transition-colors text-left"
                      >
                        <Bike className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {r.distancia} km{r.fecha ? ` · ${r.fecha}` : ""}
                          </p>
                        </div>
                        <KitBadge route={r} />
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Bike className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Sin salidas planificadas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Agrega tu próxima ruta para armar tu kit de nutrición</p>
            </div>
            <button
              onClick={() => navigate("/salida")}
              className="w-full gradient-energy text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Planificar salida <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Card 2: Planificar Ruta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Planificar Ruta</h2>
            <p className="text-xs text-muted-foreground">Importa tu ruta, divide en etapas</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/salida")}
          className="w-full border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:bg-primary active:text-primary-foreground transition-colors"
        >
          Planificar nueva ruta <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Card 3: LAGAS Planes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-sm">LAGAS</h2>
            <p className="text-xs text-muted-foreground">Kits y suscripciones</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted rounded-xl p-3 text-center opacity-50">
            <p className="text-xs font-bold">Kit salida</p>
            <p className="text-[10px] text-muted-foreground">$19.900/mes</p>
          </div>
          <div className="gradient-energy rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-white">Suscripción</p>
            <p className="text-[10px] text-white/60">$34.900/mes</p>
          </div>
        </div>
        <div className="relative">
          <button
            disabled
            className="w-full border border-border text-muted-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            Ver planes y kits <ArrowRight className="w-4 h-4" />
          </button>
          <span className="absolute -top-2 right-3 bg-muted border border-border text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Verificar build**

```bash
bun run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: dashboard muestra rutas acumuladas con badge de progreso"
```

---

## Task 3: Compras — guardar progreso al hacer toggle

**Files:**
- Modify: `src/pages/Compras.tsx`

- [ ] **Step 1: Actualizar la función `toggle` en Compras.tsx**

Reemplazar solo la función `toggle` (línea ~86):

```tsx
const toggle = (id: number) => {
  const newItems = items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
  setItems(newItems);
  if (route?.id) {
    const newChecked = newItems.filter((i) => i.checked).length;
    saveComprasProgress(route.id, newChecked, newItems.length);
  }
};
```

- [ ] **Step 2: Agregar import de `saveComprasProgress` en Compras.tsx**

Cambiar la línea de import de routeStore:

```tsx
import { getRoute, getKitConfig, generarSecciones, buildSectionItems, saveComprasProgress } from "@/lib/routeStore";
```

- [ ] **Step 3: Verificar build**

```bash
bun run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Compras.tsx
git commit -m "feat: compras guarda progreso por ruta al hacer toggle"
```

---

## Task 4: Export a Figma (470×870px)

**Files:** ninguno (operación via MCP Figma)

- [ ] **Step 1: Invocar skill figma:figma-use**

Antes de usar el MCP de Figma, invocar el skill `figma:figma-use` (prerequisito obligatorio).

- [ ] **Step 2: Crear archivo Figma nuevo**

Usar `mcp__plugin_figma_figma__create_new_file` con nombre `"LAGAS — App Screens"`.

- [ ] **Step 3: Generar frames por página**

Usar `mcp__plugin_figma_figma__generate_figma_design` para cada página al 470×870px:
- Dashboard
- Próxima Salida
- Constructor de Kit
- Calculadora Nutricional
- Perfil Ciclista
- Lista de Compra
- Marketplace

- [ ] **Step 4: Compartir link del archivo**

Retornar la URL del archivo Figma creado al usuario.

---

## Task 5: Deploy

- [ ] **Step 1: Correr todos los tests**

```bash
bun test
```

Esperado: todos los tests passing

- [ ] **Step 2: Push y deploy**

```bash
git push origin main
```

Vercel auto-deploya desde `main`.
