import { motion } from "framer-motion";
import { Flame, Droplets, Wheat, Beef, Droplet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoute, getKitConfig, generarSecciones, carbRates } from "@/lib/routeStore";

// ─── nutrition calculation ────────────────────────────────────────────────────

function calcSeccionNutricion(sectionKm: number, sectionDesnivel: number, carbRate: number) {
  const hours = sectionKm / 28 + sectionDesnivel / 800;
  const climbRate = hours > 0 ? sectionDesnivel / hours : 0; // m/h
  const kcal = Math.round(hours * (550 + climbRate * 0.1));
  const carbs = Math.round(carbRate * hours);
  const protein = Math.round(hours * 4);
  const fat = Math.round(hours * 2.5);
  const water = parseFloat((hours * 0.65).toFixed(1));
  return { kcal, carbs, protein, fat, water };
}

// ─── empty state ──────────────────────────────────────────────────────────────

function NoRoute() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🔢</div>
      <div>
        <h2 className="font-bold text-base">Sin datos de ruta</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Configura tu próxima salida para ver el cálculo nutricional
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

// ─── component ────────────────────────────────────────────────────────────────

const Calculadora = () => {
  const route = getRoute();
  const carbTarget = getKitConfig();

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
    return { id: s.id, km: s.km, ...calcSeccionNutricion(s.km, secDesnivel, carbRate) };
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
    { icon: Flame, label: "Calorías", value: total.kcal.toLocaleString("es-CL"), unit: "kcal", color: "text-primary" },
    { icon: Wheat, label: "Carbs", value: `${total.carbs}`, unit: "g", color: "text-primary" },
    { icon: Beef, label: "Proteína", value: `${total.protein}`, unit: "g", color: "text-accent" },
    { icon: Droplet, label: "Grasas", value: `${total.fat}`, unit: "g", color: "text-muted-foreground" },
    { icon: Droplets, label: "Agua", value: `${total.water.toFixed(1)}`, unit: "L", color: "text-accent" },
  ];

  const highDesnivel = route.desnivel > 2000;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Calculadora Nutricional</h1>
        <p className="text-xs text-muted-foreground">Calorías, macros e hidratación por sección</p>
      </motion.div>

      {/* Route summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="gradient-dark rounded-2xl px-4 py-3 flex items-center justify-between"
      >
        <div>
          <p className="text-primary-foreground font-semibold text-sm truncate">{route.name}</p>
          <p className="text-primary-foreground/60 text-[10px] mt-0.5">
            {route.distancia} km · {route.desnivel.toLocaleString("es-CL")} m D+ · {route.tiempo} · {carbTarget}
          </p>
        </div>
      </motion.div>

      {/* Macro summary */}
      <div className="grid grid-cols-3 gap-2">
        {macros.slice(0, 3).map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.04 }}
            className="bg-card border border-border rounded-xl p-3"
          >
            <m.icon className={`w-4 h-4 ${m.color} mb-1`} />
            <p className="text-lg font-bold">
              {m.value}<span className="text-[10px] text-muted-foreground ml-0.5">{m.unit}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {macros.slice(3).map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.04 }}
            className="bg-card border border-border rounded-xl p-3"
          >
            <m.icon className={`w-4 h-4 ${m.color} mb-1`} />
            <p className="text-lg font-bold">
              {m.value}<span className="text-[10px] text-muted-foreground ml-0.5">{m.unit}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Per section */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por sección</p>
        <div className="space-y-2">
          {seccionesData.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.04 }}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs">Sección {s.id} · {s.km} km</span>
                <span className="text-xs font-bold text-primary">{s.kcal.toLocaleString("es-CL")} kcal</span>
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
                <span>🍞 {s.carbs}g carbs</span>
                <span>🥩 {s.protein}g prot</span>
                <span>🫒 {s.fat}g grasa</span>
                <span>💧 {s.water}L</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hydration alert — dynamic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-start gap-3"
      >
        <Droplets className="w-5 h-5 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-xs">Hidratación estimada</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {total.water.toFixed(1)}L en total para {route.distancia} km.
            {highDesnivel
              ? ` Con ${route.desnivel.toLocaleString("es-CL")} m D+, considera aumentar un 15–20% en secciones de mayor desnivel.`
              : " Mantén un ritmo de ~650 ml/h para una hidratación óptima."}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Calculadora;
