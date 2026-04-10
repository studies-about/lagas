import { motion } from "framer-motion";
import { User, Target, AlertTriangle, Bike, Mountain, Calendar, ChevronRight } from "lucide-react";
import { useState } from "react";

const Perfil = () => {
  const [profile] = useState({
    nivel: "Intermedio",
    kmSemanales: "200-300 km",
    tipoSalidas: "Brevets y fondos",
    objetivos: ["Completar brevets", "Resistencia", "Rendimiento"],
    restricciones: ["Sin gluten", "Bajo en lactosa"],
  });

  const stats = { salidasMes: 6, kmAcumulados: 1240, desnivelAcumulado: 14800 };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">👤 Perfil Ciclista</h1>
        <p className="text-xs text-muted-foreground">Tu nivel, objetivos y preferencias alimentarias</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Calendar, label: "Salidas/mes", value: stats.salidasMes },
          { icon: Bike, label: "Km acumulados", value: stats.kmAcumulados.toLocaleString() },
          { icon: Mountain, label: "Desnivel (m)", value: `${(stats.desnivelAcumulado / 1000).toFixed(1)}k` },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-3 text-center"
          >
            <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Nivel */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Nivel del ciclista</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
        <div className="space-y-2">
          {[
            ["Nivel", profile.nivel],
            ["Km semanales", profile.kmSemanales],
            ["Tipo de salidas", profile.tipoSalidas],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-muted-foreground text-xs">{l}</span>
              <span className="font-medium text-xs">{v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Objetivos */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Objetivos</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.objetivos.map((obj) => (
            <span key={obj} className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
              {obj}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Restricciones */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-sm">Restricciones alimentarias</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.restricciones.map((r) => (
            <span key={r} className="bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-full border border-accent/20">
              {r}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Perfil;
