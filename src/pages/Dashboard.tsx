import { motion } from "framer-motion";
import { Bike, MapPin, Mountain, Clock, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getRoutesSorted, setActiveRoute, RouteData,
  buildSectionItems, generarSecciones, getKitConfig,
  getComprasStatus,
} from "@/lib/routeStore";

function calcTotal(route: RouteData): number {
  const secciones = generarSecciones(route.distancia);
  return secciones.reduce((acc, s) => {
    const desnivel = Math.round(route.desnivel * (s.km / route.distancia));
    return acc + buildSectionItems(s.km, desnivel, getKitConfig())
      .filter(i => i.storage === "llevar").length;
  }, 0);
}

function KitBadge({ route }: { route: RouteData }) {
  if (!route.id) return null;
  const status = getComprasStatus(route.id);
  const total = calcTotal(route);
  if (!status || status.checked === 0) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
        0/{total} · Sin iniciar
      </span>
    );
  }
  if (status.checked >= status.total) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent font-medium">
        ✓ Completo
      </span>
    );
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium">
      {status.checked}/{status.total} · En progreso
    </span>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const routes = getRoutesSorted();

  const next = routes[0] ?? null;
  const rest = routes.slice(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">LAGAS</h1>
        <p className="text-xs text-muted-foreground">Tu nutrición para cada salida</p>
      </motion.div>

      {/* Card 1: Próxima Salida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {next ? (
          <>
            <div className="gradient-dark p-4">
              <h2 className="text-primary-foreground font-bold text-sm mb-1">Próxima Salida</h2>
              <p className="text-primary-foreground/90 text-sm font-medium">{next.name}</p>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.distancia} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.desnivel.toLocaleString("es-CL")} m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary-foreground/60" />
                  <span className="text-primary-foreground/60 text-xs">{next.tiempo}</span>
                </div>
              </div>
              {next.fecha && (
                <p className="text-primary-foreground/50 text-xs mt-1">
                  {next.fecha}{next.hora ? ` · ${next.hora}` : ""}
                </p>
              )}
              <div className="mt-3">
                <KitBadge route={next} />
              </div>
            </div>
            <div className="p-4">
              <button
                onClick={() => { setActiveRoute(next); navigate("/kit"); }}
                className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Completa tu nutrición <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Carousel de rutas adicionales */}
            {rest.length > 0 && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Otras salidas
                </p>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-2.5 pb-1" style={{ width: "max-content" }}>
                    {rest.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setActiveRoute(r); navigate("/kit"); }}
                        className="w-44 bg-background border border-border rounded-xl overflow-hidden flex-shrink-0 text-left active:scale-[0.97] transition-transform"
                      >
                        <div className="gradient-dark px-3 py-2">
                          <p className="text-primary-foreground font-semibold text-xs truncate">{r.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-primary-foreground/60 text-[10px]">{r.distancia} km</span>
                            {r.fecha && <span className="text-primary-foreground/50 text-[10px]">{r.fecha}</span>}
                          </div>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between">
                          <KitBadge route={r} />
                          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
