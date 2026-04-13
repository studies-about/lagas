import { motion } from "framer-motion";
import { ShoppingCart, Store, CheckCircle2, Save, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoute, getKitConfig, generarSecciones, buildSectionItems } from "@/lib/routeStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// ─── store mapping ────────────────────────────────────────────────────────────

const storeMap: Record<string, string> = {
  "Gel de maltodextrina": "Lista",
  "Gel de cafeína": "Lista",
  "Barrita energética": "Decathlon",
  "Barrita de arroz": "Supermercado",
  "Bidón isotónico": "Lista",
  "Plátano (en control)": "Verdulería",
  "Frutos secos mix": "Supermercado",
  "Bocadillo dulce membrillo": "Supermercado",
};

// ─── aggregation ──────────────────────────────────────────────────────────────

function buildShoppingList(distancia: number, desnivel: number, carbTarget: ReturnType<typeof getKitConfig>) {
  const secciones = generarSecciones(distancia);
  const counts = new Map<string, number>();

  for (const s of secciones) {
    const secDesnivel = Math.round(desnivel * (s.km / distancia));
    const items = buildSectionItems(s.km, secDesnivel, carbTarget);
    for (const item of items) {
      if (item.storage === "ruta") continue;
      const match = item.qty.match(/^(\d+)x$/);
      const qty = match ? parseInt(match[1]) : 1;
      counts.set(item.name, (counts.get(item.name) ?? 0) + qty);
    }
  }

  return Array.from(counts.entries()).map(([name, qty], i) => ({
    id: i + 1,
    name,
    qty: `${qty}x`,
    store: storeMap[name] ?? "Varios",
    checked: false,
  }));
}

// ─── component ───────────────────────────────────────────────────────────────

function NoRoute() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🛒</div>
      <div>
        <h2 className="font-bold text-base">Sin lista generada</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Configura tu ruta y arma tu kit para generar la lista de compra
        </p>
      </div>
      <button
        onClick={() => navigate("/salida")}
        className="gradient-energy text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        Configurar ruta
      </button>
    </motion.div>
  );
}

const Compras = () => {
  const navigate = useNavigate();
  const route = getRoute();
  const carbTarget = getKitConfig();
  const { user } = useAuth();

  const initial = route ? buildShoppingList(route.distancia, route.desnivel, carbTarget) : [];
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: number) =>
    setItems(items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));

  const checked = items.filter((i) => i.checked).length;

  const byStore = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.store] ??= []).push(item);
    return acc;
  }, {});

  async function handleSaveRoute() {
    if (!route || !user) return;
    setSaving(true);
    await supabase.from("routes").upsert({
      user_id: user.id,
      name: route.name,
      distance_km: route.distancia,
      elevation_m: route.desnivel,
      date: route.fecha ?? null,
      strava_id: null,
    }, { onConflict: "user_id,strava_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/"), 1500);
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Lista de Compra</h1>
        <p className="text-xs text-muted-foreground">Generada desde tu kit · {carbTarget}</p>
      </motion.div>

      {!route ? <NoRoute /> : (
        <>
          {/* Route + progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="gradient-dark px-4 py-2.5 flex items-center justify-between">
              <p className="text-primary-foreground font-semibold text-xs truncate">{route.name}</p>
              <span className="text-[10px] text-primary-foreground/50 shrink-0 ml-2">
                {route.distancia} km · {route.desnivel.toLocaleString("es-CL")} m D+
              </span>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progreso de compra</span>
                  <span>{checked}/{items.length}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex gap-2">
            {/* Guardar ruta */}
            {user ? (
              <button
                onClick={handleSaveRoute}
                disabled={saving || saved}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  saved
                    ? "bg-green-500/10 text-green-600 border border-green-500/30"
                    : "bg-card border border-border active:border-primary"
                }`}
              >
                {saved ? <CheckCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Guardada" : saving ? "Guardando..." : "Guardar ruta"}
              </button>
            ) : (
              <button
                onClick={() => navigate("/perfil")}
                className="flex-1 bg-card border border-border py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:border-primary transition-colors"
              >
                <Save className="w-4 h-4" />
                Iniciar sesión para guardar
              </button>
            )}

            {/* Comprar con LAGAS — próximamente */}
            <div className="relative flex-1">
              <button
                disabled
                className="w-full gradient-energy text-primary-foreground/50 px-3 py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
              >
                Kit con LAGAS
              </button>
              <span className="absolute -top-2 right-1 bg-muted border border-border text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full">
                Próximamente
              </span>
            </div>
          </motion.div>

          {/* Items agrupados por tienda */}
          {Object.entries(byStore).map(([store, storeItems], gi) => (
            <motion.div
              key={store}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + gi * 0.05 }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Store className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{store}</p>
              </div>
              <div className="space-y-1.5">
                {storeItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    onClick={() => toggle(item.id)}
                    className={`w-full bg-card border rounded-xl px-4 py-3 flex items-center gap-2.5 text-left transition-all active:scale-[0.98] ${
                      item.checked ? "border-primary/30 opacity-60" : "border-border"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.checked ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`flex-1 text-xs ${item.checked ? "line-through text-muted-foreground" : "font-medium"}`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.qty}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
};

export default Compras;
