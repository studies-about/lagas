import { motion } from "framer-motion";
import { Bike, MapPin, Mountain, Clock, Package, ArrowRight } from "lucide-react";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS  = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];

function formatFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { day: d, month: MESES[m - 1], dayName: DIAS[date.getDay()] };
}
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">LAGAS</h1>
        <p className="text-xs text-muted-foreground">Tu nutrición para cada salida</p>
      </motion.div>

      {/* Card 1: Rutas en carrusel de cards apiladas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {routes.length > 0 ? (
          <div
            className="overflow-x-auto snap-x snap-mandatory -mx-4 px-4 flex gap-3 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {routes.map((r, i) => {
              const fecha = r.fecha ? formatFecha(r.fecha) : null;
              return (
                <div
                  key={r.id}
                  className="snap-start shrink-0 w-[calc(100%-24px)] bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="gradient-dark p-4">
                    {i === 0 && (
                      <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-wide mb-2">
                        Próxima Salida
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {fecha ? (
                        <div>
                          <p className="text-primary-foreground text-2xl font-bold leading-none">{fecha.day}</p>
                          <p className="text-primary-foreground/80 text-sm font-semibold">{fecha.month}</p>
                          <p className="text-primary-foreground/40 text-[10px]">{fecha.dayName}{r.hora ? ` · ${r.hora}` : ""}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-primary-foreground/40 text-xs italic">Sin fecha</p>
                        </div>
                      )}
                      <div>
                        <p className="text-primary-foreground text-2xl font-bold leading-none">{r.distancia}</p>
                        <p className="text-primary-foreground/80 text-sm font-semibold">km</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-primary-foreground/40" />
                          <span className="text-primary-foreground/40 text-[10px]">distancia</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-primary-foreground text-2xl font-bold leading-none">{(r.desnivel / 1000).toFixed(r.desnivel < 1000 ? 0 : 1)}</p>
                        <p className="text-primary-foreground/80 text-sm font-semibold">km D+</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Mountain className="w-2.5 h-2.5 text-primary-foreground/40" />
                          <span className="text-primary-foreground/40 text-[10px]">desnivel</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary-foreground/40 shrink-0" />
                      <span className="text-primary-foreground/60 text-xs">{r.tiempo}</span>
                      <span className="ml-auto"><KitBadge route={r} /></span>
                    </div>
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => { setActiveRoute(r); navigate("/kit"); }}
                      className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      Completa tu nutrición <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
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
