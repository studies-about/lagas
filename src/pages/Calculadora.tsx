import { motion } from "framer-motion";
import { Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoute, getKitConfig, type CarbTarget } from "@/lib/routeStore";

// ─── plan builder ─────────────────────────────────────────────────────────────

type Slot = {
  minStart: number;
  hydType: "Isotónico" | "Agua";
  food: { name: string; carbs: number }[];
  totalCarbs: number;
};

function buildPlan(km: number, desnivel: number, carbTarget: CarbTarget): Slot[] {
  const totalMin = Math.round((km / 28 + desnivel / 800) * 60);
  const slots: Slot[] = [];
  let gelCount = 0;

  for (let min = 0; min < totalMin; min += 20) {
    const idx = Math.floor(min / 20);
    const hydType: "Isotónico" | "Agua" = idx % 2 === 0 ? "Isotónico" : "Agua";
    const food: { name: string; carbs: number }[] = [];

    if (min >= 20) {
      const addGel = () => {
        // Introduce cafeína gradualmente: cada 3er gel, después de 60min
        const isCaf = gelCount % 3 === 2 && min >= 60;
        food.push({ name: isCaf ? "Gel cafeína" : "Gel malt.", carbs: 22 });
        gelCount++;
      };

      if (carbTarget === "45-60 g/h") {
        // 1 gel cada 40 min (~33 g/h)
        if (idx % 2 === 1) addGel();
      } else if (carbTarget === "60-90 g/h") {
        // 1 gel cada 20 min (~66 g/h)
        addGel();
      } else {
        // 90+ g/h: 1 gel cada 20min + barrita cada 40min (~100 g/h)
        addGel();
        if (idx % 2 === 1) food.push({ name: "Barrita", carbs: 35 });
      }
    }

    slots.push({
      minStart: min,
      hydType,
      food,
      totalCarbs: food.reduce((s, f) => s + f.carbs, 0),
    });
  }

  return slots;
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
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
          Configura tu próxima salida para ver el plan nutricional
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

  if (!route) return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Nutrición</h1>
        <p className="text-xs text-muted-foreground">Plan de alimentación cada 20 min</p>
      </motion.div>
      <NoRoute />
    </div>
  );

  const slots = buildPlan(route.distancia, route.desnivel, carbTarget);
  const totalCarbs = slots.reduce((s, sl) => s + sl.totalCarbs, 0);
  const totalHydration = slots.length * 200;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Nutrición</h1>
        <p className="text-xs text-muted-foreground">Plan de alimentación cada 20 min</p>
      </motion.div>

      {/* Route + resumen */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="gradient-dark rounded-2xl px-4 py-3"
      >
        <p className="text-primary-foreground font-semibold text-sm truncate">{route.name}</p>
        <p className="text-primary-foreground/60 text-[10px] mt-0.5">
          {route.distancia} km · {route.desnivel.toLocaleString("es-CL")} m D+ · {route.tiempo} · {carbTarget}
        </p>
      </motion.div>

      {/* Totales */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 gap-2"
      >
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-accent shrink-0" />
          <div>
            <p className="text-sm font-bold">{(totalHydration / 1000).toFixed(1)} L</p>
            <p className="text-[10px] text-muted-foreground">hidratación total</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-base shrink-0">🟠</span>
          <div>
            <p className="text-sm font-bold">{totalCarbs} g</p>
            <p className="text-[10px] text-muted-foreground">carbohidratos totales</p>
          </div>
        </div>
      </motion.div>

      {/* Timeline cada 20 min */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.09 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Plan cada 20 min</p>

        {/* Header */}
        <div className="grid grid-cols-[48px_1fr_52px] gap-2 px-3 pb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Hora</span>
          <span>Hidratación · Nutrición</span>
          <span className="text-right">Carbs</span>
        </div>

        <div className="space-y-1">
          {slots.map((slot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.015 }}
              className={`grid grid-cols-[48px_1fr_52px] gap-2 items-center px-3 py-2.5 rounded-xl ${
                i === 0
                  ? "bg-muted/50"
                  : i % 2 === 0
                    ? "bg-card border border-border"
                    : "bg-muted/30"
              }`}
            >
              {/* Time */}
              <span className="text-xs font-mono text-muted-foreground">{fmtMin(slot.minStart)}</span>

              {/* Content */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                <span className="text-muted-foreground">
                  💧 <span className="font-medium text-foreground">200ml</span>{" "}
                  <span className="text-muted-foreground/70">{slot.hydType}</span>
                </span>
                {slot.food.length > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    {slot.food.map((f, j) => (
                      <span key={j} className="font-medium">
                        {f.name.startsWith("Gel") ? "🟠" : "🍫"} {f.name}
                      </span>
                    ))}
                  </>
                )}
                {slot.food.length === 0 && (
                  <span className="text-muted-foreground/50 italic">Calentamiento</span>
                )}
              </div>

              {/* Carbs */}
              <div className="text-right">
                {slot.totalCarbs > 0 ? (
                  <span className="text-[10px] font-bold text-primary">{slot.totalCarbs}g</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/30">—</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Calculadora;
