import { motion } from "framer-motion";
import { Flame, Droplets, Wheat, Beef, Droplet, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoute, getKitConfig, generarSecciones, carbRates } from "@/lib/routeStore";

// ─── nutrition calculation ────────────────────────────────────────────────────

function calcNutricion(km: number, desnivel: number, carbRate: number) {
  const hours = km / 28 + desnivel / 800;
  const climbRate = hours > 0 ? desnivel / hours : 0;
  return {
    hours,
    kcal: Math.round(hours * (550 + climbRate * 0.1)),
    carbs: Math.round(carbRate * hours),
    protein: Math.round(hours * 4),
    fat: Math.round(hours * 2.5),
    water: parseFloat((hours * 0.65).toFixed(1)),
  };
}

function calcIntervalos(km: number, desnivel: number, carbRate: number) {
  const totalHours = km / 28 + desnivel / 800;
  const climbRate = totalHours > 0 ? desnivel / totalHours : 0;
  const intervals: { label: string; kcal: number; carbs: number; water: number }[] = [];
  let elapsed = 0;
  while (elapsed < totalHours - 0.01) {
    const duration = Math.min(0.5, totalHours - elapsed);
    const startMin = Math.round(elapsed * 60);
    const endMin = Math.round((elapsed + duration) * 60);
    const h = Math.floor(startMin / 60);
    const m = startMin % 60;
    const h2 = Math.floor(endMin / 60);
    const m2 = endMin % 60;
    const label = `${h}:${String(m).padStart(2, "0")} – ${h2}:${String(m2).padStart(2, "0")}`;
    intervals.push({
      label,
      kcal: Math.round(duration * (550 + climbRate * 0.1)),
      carbs: Math.round(carbRate * duration),
      water: parseFloat((duration * 0.65).toFixed(1)),
    });
    elapsed += duration;
  }
  return intervals;
}

// ─── empty state ──────────────────────────────────────────────────────────────

function NoRoute() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🔢</div>
      <div>
        <h2 className="font-bold text-base">Sin datos de ruta</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Configura tu próxima salida para ver el cálculo nutricional
        </p>
      </div>
      <button onClick={() => navigate("/salida")}
        className="gradient-energy text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        Configurar ruta
      </button>
    </motion.div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

const Calculadora = () => {
  const route = getRoute();
  const carbTarget = getKitConfig();
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  if (!route) return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Calculadora Nutricional</h1>
        <p className="text-xs text-muted-foreground">Calorías, macros e hidratación por sección</p>
      </motion.div>
      <NoRoute />
    </div>
  );

  const carbRate = carbRates[carbTarget];
  const secciones = generarSecciones(route.distancia);

  const seccionesData = secciones.map((s) => {
    const secDesnivel = Math.round(route.desnivel * (s.km / route.distancia));
    return { id: s.id, km: s.km, desnivel: secDesnivel, ...calcNutricion(s.km, secDesnivel, carbRate) };
  });

  const total = seccionesData.reduce(
    (acc, s) => ({
      kcal: acc.kcal + s.kcal,
      carbs: acc.carbs + s.carbs,
      protein: acc.protein + s.protein,
      fat: acc.fat + s.fat,
      water: parseFloat((acc.water + s.water).toFixed(1)),
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0, water: 0 }
  );

  const macros = [
    { icon: Flame,    label: "kcal",    value: total.kcal.toLocaleString("es-CL"), color: "text-primary" },
    { icon: Wheat,    label: "carbs",   value: `${total.carbs}g`,                  color: "text-primary" },
    { icon: Beef,     label: "prot",    value: `${total.protein}g`,                color: "text-accent" },
    { icon: Droplet,  label: "grasa",   value: `${total.fat}g`,                    color: "text-muted-foreground" },
    { icon: Droplets, label: "agua",    value: `${total.water}L`,                  color: "text-accent" },
  ];

  function toggleSection(i: number) {
    setOpenSections(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Calculadora Nutricional</h1>
        <p className="text-xs text-muted-foreground">Calorías, macros e hidratación por sección</p>
      </motion.div>

      {/* Route summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="gradient-dark rounded-2xl px-4 py-3"
      >
        <p className="text-primary-foreground font-semibold text-sm truncate">{route.name}</p>
        <p className="text-primary-foreground/60 text-[10px] mt-0.5">
          {route.distancia} km · {route.desnivel.toLocaleString("es-CL")} m D+ · {route.tiempo} · {carbTarget}
        </p>
      </motion.div>

      {/* 5 macros en una fila */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-5 gap-1.5"
      >
        {macros.map((m, i) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-2.5 flex flex-col items-center text-center">
            <m.icon className={`w-3.5 h-3.5 ${m.color} mb-1`} />
            <p className="text-xs font-bold leading-tight">{m.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Por sección con desglose 30 min */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por sección</p>
        <div className="space-y-2">
          {seccionesData.map((s, i) => {
            const intervalos = calcIntervalos(s.km, s.desnivel, carbRate);
            const isOpen = openSections.has(i);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Header sección */}
                <button onClick={() => toggleSection(i)}
                  className="w-full px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-xs">Sección {s.id} · {s.km} km</span>
                    <span className="text-xs font-bold text-primary">{s.kcal.toLocaleString("es-CL")} kcal</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Resumen macros sección */}
                <div className="px-4 pb-3 flex gap-3 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                  <span>🍞 {s.carbs}g</span>
                  <span>🥩 {s.protein}g</span>
                  <span>🫒 {s.fat}g</span>
                  <span>💧 {s.water}L</span>
                </div>

                {/* Desglose 30 min */}
                {isOpen && (
                  <div className="border-t border-border/50">
                    <div className="px-4 py-1.5 grid grid-cols-4 text-[9px] text-muted-foreground font-semibold uppercase tracking-wide bg-muted/30">
                      <span>Intervalo</span>
                      <span className="text-center">kcal</span>
                      <span className="text-center">carbs</span>
                      <span className="text-center">agua</span>
                    </div>
                    {intervalos.map((iv, j) => (
                      <div key={j} className={`px-4 py-2 grid grid-cols-4 text-xs ${j % 2 === 0 ? "" : "bg-muted/20"}`}>
                        <span className="text-[10px] text-muted-foreground font-mono">{iv.label}</span>
                        <span className="text-center font-medium">{iv.kcal}</span>
                        <span className="text-center font-medium">{iv.carbs}g</span>
                        <span className="text-center font-medium">{iv.water}L</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hydration alert */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-start gap-3"
      >
        <Droplets className="w-5 h-5 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-xs">Hidratación estimada</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {total.water.toFixed(1)}L en total para {route.distancia} km.
            {route.desnivel > 2000
              ? ` Con ${route.desnivel.toLocaleString("es-CL")} m D+, considera aumentar un 15–20% en secciones de mayor desnivel.`
              : " Mantén un ritmo de ~650 ml/h para una hidratación óptima."}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Calculadora;
