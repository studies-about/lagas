import { motion } from "framer-motion";
import { ChevronDown, MapPin, Mountain, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRoute, generarSecciones, buildSectionItems, saveKitConfig, getKitConfig,
  type CarbTarget,
} from "@/lib/routeStore";

const carbOptions: CarbTarget[] = ["45-60 g/h", "60-90 g/h", "90+ g/h"];

const storageOptions = [
  { key: "maillot", label: "Bolsillos maillot" },
  { key: "frame", label: "Frame bag" },
  { key: "toptube", label: "Top tube bag" },
];

// ─── empty state ─────────────────────────────────────────────────────────────

function NoRoute() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">
        🎒
      </div>
      <div>
        <h2 className="font-bold text-base">Sin ruta configurada</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Configura tu próxima salida para generar el kit de nutrición
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

// ─── component ───────────────────────────────────────────────────────────────

const Kit = () => {
  const route = getRoute();
  const [selectedCarbs, setSelectedCarbs] = useState<CarbTarget>(getKitConfig());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));
  const [selectedStorage, setSelectedStorage] = useState<Set<string>>(new Set(["maillot"]));
  const [bidonCount, setBidonCount] = useState<1 | 2>(1);
  const [bidonSize, setBidonSize] = useState<550 | 750>(750);

  if (!route) return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Constructor de Kit</h1>
        <p className="text-xs text-muted-foreground">Personaliza tu nutrición por sección</p>
      </motion.div>
      <NoRoute />
    </div>
  );

  const secciones = generarSecciones(route.distancia);
  const sections = secciones.map((s) => ({
    name: `Sección ${s.id}`,
    km: s.km,
    desnivel: Math.round(route.desnivel * (s.km / route.distancia)),
    items: buildSectionItems(s.km, Math.round(route.desnivel * (s.km / route.distancia)), selectedCarbs).map((item) =>
      item.name === "Bidón isotónico"
        ? { ...item, qty: bidonCount === 1 ? `${bidonSize} ml` : `2×${bidonSize} ml`, weight: bidonCount * bidonSize }
        : item
    ),
  }));

  const totalWeight = sections.reduce(
    (acc, s) => acc + s.items.reduce((a, it) => a + it.weight, 0),
    0
  );

  function toggleStorage(key: string) {
    setSelectedStorage((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Constructor de Kit</h1>
        <p className="text-xs text-muted-foreground">Personaliza tu nutrición por sección</p>
      </motion.div>

      {/* Route summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="gradient-dark px-4 py-2.5 flex items-center justify-between">
          <p className="text-primary-foreground font-semibold text-xs truncate">{route.name}</p>
          <span className="text-[10px] text-primary-foreground/50 shrink-0 ml-2">
            {route.source === "strava" ? "Strava" : "Manual"}
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { icon: MapPin, value: `${route.distancia} km` },
            { icon: Mountain, value: `${route.desnivel.toLocaleString("es-CL")} m` },
            { icon: Clock, value: route.tiempo },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-center gap-1.5 py-2.5">
              <s.icon className="w-3 h-3 text-primary shrink-0" />
              <span className="text-xs font-semibold">{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Carb target */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Objetivo carbohidratos
        </p>
        <div className="flex gap-2">
          {carbOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => { setSelectedCarbs(opt); saveKitConfig(opt); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedCarbs === opt
                  ? "gradient-energy text-primary-foreground"
                  : "bg-card border border-border active:border-primary"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Storage */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Almacenaje
        </p>
        <div className="flex gap-2">
          {storageOptions.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleStorage(s.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedStorage.has(s.key)
                  ? "gradient-energy text-primary-foreground"
                  : "bg-card border border-border active:border-primary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bidones */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Bidones
        </p>
        <div className="flex gap-2 mb-2">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              onClick={() => setBidonCount(n)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                bidonCount === n
                  ? "gradient-energy text-primary-foreground"
                  : "bg-card border border-border active:border-primary"
              }`}
            >
              {n} bidón{n === 2 ? "es" : ""}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {([550, 750] as const).map((ml) => (
            <button
              key={ml}
              onClick={() => setBidonSize(ml)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                bidonSize === ml
                  ? "gradient-energy text-primary-foreground"
                  : "bg-card border border-border active:border-primary"
              }`}
            >
              {ml} ml
            </button>
          ))}
        </div>
      </motion.div>

      {/* Peso total */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between"
      >
        <span className="text-xs text-muted-foreground">Peso total a cargar</span>
        <span className="text-sm font-bold text-primary">{(totalWeight / 1000).toFixed(2)} kg</span>
      </motion.div>

      {/* Sections accordion */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Secciones
        </p>
        <div className="space-y-2">
          {sections.map((section, si) => (
            <motion.div
              key={`${selectedCarbs}-${si}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenSections(prev => { const n = new Set(prev); if (n.has(si)) n.delete(si); else n.add(si); return n; })}
                className="w-full gradient-energy px-4 py-3 flex items-center justify-between"
              >
                <span className="text-primary-foreground font-semibold text-xs">
                  {section.name} · {section.km} km · {section.items.reduce((a, it) => a + it.weight, 0).toLocaleString("es-CL")} g
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary-foreground transition-transform ${
                    openSections.has(si) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openSections.has(si) && (
                <div className="divide-y divide-border/50">
                  {section.items.map((item, i) => {
                    const location = item.storage === "ruta"
                      ? "En control"
                      : item.name.includes("Bidón")
                        ? (selectedStorage.has("frame") ? "Frame bag" : "Maillot")
                        : item.name.includes("Barrita")
                          ? (selectedStorage.has("frame") ? "Frame bag" : selectedStorage.has("maillot") ? "Maillot" : "Top tube")
                          : selectedStorage.has("maillot")
                            ? "Maillot"
                            : selectedStorage.has("toptube")
                              ? "Top tube"
                              : "Frame bag";
                    return (
                      <div key={i} className="px-4 py-2.5 flex items-center gap-2 text-xs">
                        <span className="flex-1">{item.name}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">{item.qty}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          item.storage === "ruta"
                            ? "bg-accent/10 text-accent"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {location}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kit;
