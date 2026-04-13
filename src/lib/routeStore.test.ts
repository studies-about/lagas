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
