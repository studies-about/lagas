import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";
import { MapPin, Mountain, Clock, Upload, TrendingUp, TrendingDown, Minus } from "lucide-react";

const stages = [
  { id: 1, name: "Etapa 1", from: "Santiago", to: "Melipilla", km: 65, elevation: 450, time: "2h 10min" },
  { id: 2, name: "Etapa 2", from: "Melipilla", to: "San Antonio", km: 72, elevation: 680, time: "2h 30min" },
  { id: 3, name: "Etapa 3", from: "San Antonio", to: "Casablanca", km: 58, elevation: 920, time: "2h 20min" },
  { id: 4, name: "Etapa 4", from: "Casablanca", to: "Valparaíso", km: 63, elevation: 540, time: "2h 05min" },
  { id: 5, name: "Etapa 5", from: "Valparaíso", to: "Viña del Mar", km: 54, elevation: 610, time: "1h 50min" },
];

const recentRides = [
  { date: "22 Mar", name: "Brevet 200K Cajón del Maipo", km: 205, elevation: 2800, time: "7h 20min", feeling: "up" },
  { date: "8 Mar", name: "Fondo 150K Colina", km: 148, elevation: 1400, time: "5h 10min", feeling: "down" },
  { date: "22 Feb", name: "Brevet 200K Costa", km: 210, elevation: 1900, time: "6h 50min", feeling: "up" },
  { date: "1 Feb", name: "Entrenamiento 120K", km: 118, elevation: 980, time: "4h 15min", feeling: "neutral" },
];

const Planificador = () => (
  <div>
    <PageHeader
      icon="🗺️"
      title="Planificador de Ruta"
      description="Ingresa tu ruta manualmente o importa desde Strava/Garmin. Divide por etapas cada 50-80 km."
    />

    {/* Import buttons */}
    <div className="flex gap-3 mb-8">
      <button className="gradient-energy text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
        <Upload className="w-4 h-4" /> Importar desde Strava
      </button>
      <button className="bg-card border border-border px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:border-primary transition-colors">
        <Upload className="w-4 h-4" /> Importar desde Garmin
      </button>
    </div>

    {/* Route summary */}
    <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl">
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
        <p className="text-xl font-bold">312 km</p>
        <p className="text-xs text-muted-foreground">Distancia total</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <Mountain className="w-4 h-4 text-primary mx-auto mb-1" />
        <p className="text-xl font-bold">3,200 m</p>
        <p className="text-xs text-muted-foreground">Desnivel acumulado</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
        <p className="text-xl font-bold">10h 55m</p>
        <p className="text-xs text-muted-foreground">Duración estimada</p>
      </div>
    </div>

    {/* Stages */}
    <h2 className="text-lg font-semibold mb-4">Etapas</h2>
    <div className="space-y-3 max-w-3xl mb-10">
      {stages.map((stage, i) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg gradient-energy text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
            {stage.id}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{stage.from} → {stage.to}</p>
            <p className="text-xs text-muted-foreground">{stage.km} km · {stage.elevation} m D+ · {stage.time}</p>
          </div>
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-energy rounded-full" style={{ width: `${(stage.km / 80) * 100}%` }} />
          </div>
        </motion.div>
      ))}
    </div>

    {/* Recent rides */}
    <h2 className="text-lg font-semibold mb-4">Últimas salidas</h2>
    <div className="space-y-3 max-w-3xl">
      {recentRides.map((ride, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.05 }}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <div className="text-center w-14 shrink-0">
            <span className="text-xs text-muted-foreground">{ride.date}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{ride.name}</p>
            <p className="text-xs text-muted-foreground">{ride.km} km · {ride.elevation} m D+ · {ride.time}</p>
          </div>
          {ride.feeling === "up" && <TrendingUp className="w-4 h-4 text-accent shrink-0" />}
          {ride.feeling === "down" && <TrendingDown className="w-4 h-4 text-destructive shrink-0" />}
          {ride.feeling === "neutral" && <Minus className="w-4 h-4 text-muted-foreground shrink-0" />}
        </motion.div>
      ))}
    </div>
  </div>
);

export default Planificador;
