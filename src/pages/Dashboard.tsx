import { motion } from "framer-motion";
import { Bike, MapPin, Mountain, Clock, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoute } from "@/lib/routeStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const route = getRoute();

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          {/* <Flame className="w-6 h-6 text-primary" /> */}
          <h1 className="text-xl font-bold">LAGAS</h1>
        </div>
        <p className="text-xs text-muted-foreground">Tu nutrición para cada salida</p>
      </motion.div>

      {/* Card 1: Próxima Salida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {route ? (
          <>
            <div className="gradient-dark p-4">
              <h2 className="text-primary-foreground font-bold text-sm mb-1">Próxima Salida</h2>
              <p className="text-primary-foreground/90 text-sm font-medium">{route.name}</p>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{route.distancia} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{route.desnivel.toLocaleString("es-CL")} m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{route.tiempo}</span>
                </div>
              </div>
              {route.fecha && (
                <p className="text-primary-foreground/50 text-xs mt-1">
                  {route.fecha}{route.hora ? ` · ${route.hora}` : ""}
                </p>
              )}
              <div className="mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  ⏳ Kit pendiente
                </span>
              </div>
            </div>
            <div className="p-4">
              <button
                onClick={() => navigate("/kit")}
                className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Armar kit para esta salida <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Bike className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Sin salidas planificadas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Agrega tu próxima ruta para armar tu kit de nutrición</p>
            </div>
            <button
              onClick={() => navigate("/salida")}
              className="w-full gradient-energy text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Planificar salida <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Card 2: Planificar Ruta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Planificar Ruta</h2>
            <p className="text-xs text-muted-foreground">Importa tu ruta, divide en etapas</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/salida")}
          className="w-full border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:bg-primary active:text-primary-foreground transition-colors"
        >
          Planificar nueva ruta <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Card 3: LAGAS Planes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-sm">LAGAS</h2>
            <p className="text-xs text-muted-foreground">Kits y suscripciones</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted rounded-xl p-3 text-center opacity-50">
            <p className="text-xs font-bold">Kit salida</p>
            <p className="text-[10px] text-muted-foreground">$19.900/mes</p>
          </div>
          <div className="gradient-energy rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-white">Suscripción</p>
            <p className="text-[10px] text-white/60">$34.900/mes</p>
          </div>
        </div>
        <div className="relative">
          <button
            disabled
            className="w-full border border-border text-muted-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            Ver planes y kits <ArrowRight className="w-4 h-4" />
          </button>
          <span className="absolute -top-2 right-3 bg-muted border border-border text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
