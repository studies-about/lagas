# Spec: Rutas acumuladas, Kit status y Export Figma

**Fecha:** 2026-04-13  
**Estado:** Aprobado

---

## 1. Acumulación de rutas en Home

### Problema
`routeStore.ts` guarda una sola ruta. Al crear una nueva desde Próxima Salida, reemplaza la anterior.

### Solución

**Storage:**
- Nueva clave `lagas_routes` en localStorage: array de `RouteData[]`
- Cada `RouteData` recibe campo `id: string` generado con `crypto.randomUUID()`
- `saveRoute()` agrega al array (o reemplaza si mismo `id`) y además escribe en `lagas_route` (ruta activa — sin cambios para Kit, Calculadora, Compras)
- Nueva función `getRoutes(): RouteData[]` — retorna array
- Nueva función `setActiveRoute(route: RouteData)` — escribe en `lagas_route`
- Nueva función `deleteRoute(id: string)` — elimina del array

**Ordenamiento:** por `fecha + hora` ascendente. Rutas sin fecha van al final.

**Home — UI:**
- Muestra solo la ruta más próxima (índice 0 del array ordenado)
- Si hay N rutas adicionales: botón `"y N más →"` debajo de la tarjeta
- Al tocar el botón: expande lista compacta con las rutas restantes (nombre + fecha + km)
- Tap en cualquier ruta compacta: la setea como activa (`setActiveRoute`) y navega a `/kit`

---

## 2. Badge de status del kit (Home)

### Problema
El badge "⏳ Kit pendiente" es estático y no refleja el progreso real de compras.

### Solución

**Storage:**
- Nueva clave `lagas_compras_status` en localStorage
- Tipo: `Record<routeId, { checked: number; total: number }>`
- `saveComprasProgress(routeId, checked, total)` — escribe al hacer toggle en Compras
- `getComprasStatus(routeId)` — lee el status

**Compras.tsx:**
- `toggle()` también llama `saveComprasProgress(route.id, newChecked, items.length)` después de cada cambio

**Dashboard — badge:**
- `total` se calcula con `buildSectionItems` para la ruta (mismo cálculo que Kit)
- Si no hay status guardado → `"0/N · Sin iniciar"`
- Si `checked > 0 && checked < total` → `"X/N · En progreso"`
- Si `checked === total` → `"✓ Completo"`

---

## 3. Export a Figma (470×870px)

**Páginas a exportar:** Dashboard, Próxima Salida, Constructor de Kit, Calculadora Nutricional, Perfil Ciclista, Lista de Compra, Marketplace.

**Proceso:**
- Crear archivo nuevo en Figma via MCP
- Generar un frame de 470×870px por página
- Cada frame se construye desde el código actual de cada página

---

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/lib/routeStore.ts` | Agregar `id` a `RouteData`, `getRoutes()`, `setActiveRoute()`, `deleteRoute()`, `saveComprasProgress()`, `getComprasStatus()` |
| `src/pages/Dashboard.tsx` | Leer `getRoutes()`, mostrar ruta próxima + expandir lista, badge dinámico |
| `src/pages/Compras.tsx` | `toggle()` guarda progreso via `saveComprasProgress()` |
| `src/pages/ProximaSalida.tsx` | `saveRoute()` ahora retorna `RouteData` con `id` (sin cambio de firma visible) |

**Sin cambios:** `Kit.tsx`, `Calculadora.tsx` (siguen usando `getRoute()` para ruta activa).
