import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

const rides = [
  { date: "22 Mar", name: "Brevet 200K Cajón del Maipo", kcal: 5200, rating: 4.2, compliance: 85, trend: "up" },
  { date: "8 Mar", name: "Fondo 150K Colina", kcal: 3800, rating: 3.8, compliance: 70, trend: "down" },
  { date: "22 Feb", name: "Brevet 200K Costa", kcal: 5400, rating: 4.5, compliance: 92, trend: "up" },
  { date: "1 Feb", name: "Entrenamiento 120K", kcal: 3200, rating: 3.5, compliance: 60, trend: "neutral" },
  { date: "18 Ene", name: "Brevet 300K Andes", kcal: 8100, rating: 4.0, compliance: 78, trend: "up" },
];

const insights = [
  { icon: "✅", text: "Los geles de maltodextrina funcionan bien en etapas planas" },
  { icon: "⚠️", text: "Tendencia a deshidratarte en etapas con más de 800m D+" },
  { icon: "💡", text: "Mejor rendimiento cuando incluyes comida sólida cada 2h" },
];

const Historial = () => (
  <div>
    <PageHeader
      icon="📊"
      title="Historial y Aprendizaje"
      description="Patrones personales, comparación entre salidas y recomendaciones basadas en tu historial."
    />

    {/* Insights */}
    <div className="grid md:grid-cols-3 gap-3 mb-8 max-w-4xl">
      {insights.map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
        >
          <span className="text-lg">{insight.icon}</span>
          <p className="text-sm text-muted-foreground">{insight.text}</p>
        </motion.div>
      ))}
    </div>

    {/* Ride history */}
    <h2 className="text-lg font-semibold mb-4">Salidas recientes</h2>
    <div className="space-y-3 max-w-4xl">
      {rides.map((ride, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <div className="text-center w-16 shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <span className="text-xs text-muted-foreground">{ride.date}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{ride.name}</p>
            <p className="text-xs text-muted-foreground">{ride.kcal.toLocaleString()} kcal consumidas</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="font-bold text-sm">{ride.rating}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cumplimiento</p>
              <p className="font-bold text-sm font-mono">{ride.compliance}%</p>
            </div>
            {ride.trend === "up" && <TrendingUp className="w-4 h-4 text-accent" />}
            {ride.trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
            {ride.trend === "neutral" && <Minus className="w-4 h-4 text-muted-foreground" />}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Historial;
