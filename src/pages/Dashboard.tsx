import { motion } from "framer-motion";
import { Bike, MapPin, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const proximaSalida = null; // reemplazar con datos reales cuando estén disponibles

const Dashboard = () => {
  const navigate = useNavigate();

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
        {proximaSalida ? (
          <>
            <div className="gradient-dark p-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-primary-foreground font-bold text-sm">Próxima Salida</h2>
              </div>
              <p className="text-primary-foreground/90 text-sm font-medium">{proximaSalida.nombre}</p>
              <p className="text-primary-foreground/60 text-xs mt-1">{proximaSalida.detalle}</p>
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
            <h2 className="font-bold text-sm">LAGAS Planes</h2>
            <p className="text-xs text-muted-foreground">Kits y suscripciones para brevets</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-xs font-bold">Randonneur</p>
            <p className="text-[10px] text-muted-foreground">$19.900/mes</p>
          </div>
          <div className="gradient-dark rounded-xl p-3 text-center border border-primary/30">
            <p className="text-xs font-bold text-primary-foreground">Super Randonneur</p>
            <p className="text-[10px] text-primary-foreground/60">$34.900/mes</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/suscripcion")}
          className="w-full border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:border-primary active:text-primary transition-colors"
        >
          Ver planes y kits <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
