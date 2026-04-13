import { motion } from "framer-motion";
import { Bike, MapPin, Mountain, Clock, ArrowRight, SlidersHorizontal, Unlink, Droplets, CloudRain, Thermometer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useStravaAuth } from "@/hooks/useStravaAuth";
import { useStravaActivities, type StravaActivity } from "@/hooks/useStravaActivities";
import { saveRoute, estimarTiempo, generarSecciones } from "@/lib/routeStore";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(0)} km`;
}

function formatElevation(meters: number) {
  return `${Math.round(meters).toLocaleString("es-CL")} m D+`;
}

function formatMovingTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

// ─── types ───────────────────────────────────────────────────────────────────

type Mode = "empty" | "manual" | "google" | "strava";

// ─── views ───────────────────────────────────────────────────────────────────

function EmptyState({ onManual, onGoogle, googleConnected }: {
  onManual: () => void;
  onGoogle: () => void;
  googleConnected: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-5 py-10"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Bike className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="font-bold text-base">Sin ruta configurada</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Conecta tu cuenta o ingresa los datos manualmente
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {/* 1 — Google (solo si no está conectado) */}
        {!googleConnected && (
          <button
            onClick={onGoogle}
            className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Conectar Google
          </button>
        )}

        {/* 2 — Manual */}
        <button
          onClick={onManual}
          className="w-full bg-card border border-border py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:border-primary transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Configurar manualmente
        </button>

        {/* 3 — Strava (próximamente) */}
        <div className="relative w-full">
          <button
            disabled
            className="w-full bg-muted/40 border border-border/50 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-muted-foreground cursor-not-allowed opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Conectar Strava
          </button>
          <span className="absolute -top-2 right-3 bg-muted border border-border text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full">
            Próximamente
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface Weather {
  temp: number;
  precip: number;
}

function buildCalendar() {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function ManualView({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  const [distancia, setDistancia] = useState(100);
  const [desnivel, setDesnivel] = useState(1000);
  const [fecha, setFecha] = useState<Date>(new Date());
  const now = new Date();
  const [hora, setHora] = useState(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  );
  const [weather, setWeather] = useState<Weather | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const tiempo = estimarTiempo(distancia, desnivel);
  const days = buildCalendar();
  const diasSemana = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: -33.45, lng: -70.67 }) // fallback: Santiago
      );
    } else {
      setCoords({ lat: -33.45, lng: -70.67 });
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    const iso = toISO(fecha);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&start_date=${iso}&end_date=${iso}&forecast_days=16`
    )
      .then((r) => r.json())
      .then((data) => {
        const temp = data?.daily?.temperature_2m_max?.[0];
        const precip = data?.daily?.precipitation_probability_max?.[0];
        if (temp != null) setWeather({ temp: Math.round(temp), precip: precip ?? 0 });
        else setWeather(null);
      })
      .catch(() => setWeather(null));
  }, [coords, fecha]);

  function handleConfirm() {
    saveRoute({ name: "Ruta", distancia, desnivel, tiempo, source: "manual", fecha: toISO(fecha), hora });
    onConfirm();
  }

  const isToday = (d: Date) => toISO(d) === toISO(new Date());
  const isSelected = (d: Date) => toISO(d) === toISO(fecha);

  return (
    <div className="space-y-4">
      {/* Resumen prominente */}
      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-dark rounded-2xl px-4 py-4"
      >
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
          <div className="pr-3">
            <p className="text-2xl font-bold text-primary-foreground leading-none">{distancia}</p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">km</p>
          </div>
          <div className="px-3">
            <p className="text-2xl font-bold text-primary-foreground leading-none">
              {desnivel.toLocaleString("es-CL")}
            </p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">m D+</p>
          </div>
          <div className="pl-3">
            <p className="text-xl font-bold text-primary-foreground leading-none">
              {fecha.getDate()} {meses[fecha.getMonth()].charAt(0).toUpperCase() + meses[fecha.getMonth()].slice(1)}
            </p>
            <p className="text-[10px] text-primary-foreground/50 mt-1">{diasSemana[fecha.getDay()]}</p>
          </div>
        </div>
      </motion.div>

      {/* Sliders */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {/* Distancia */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Distancia</span>
            </div>
            <span className="text-lg font-bold text-primary">{distancia} km</span>
          </div>
          <Slider min={30} max={250} step={5} value={[distancia]} onValueChange={([v]) => setDistancia(v)} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>30 km</span><span>250 km</span>
          </div>
        </div>

        {/* Desnivel */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Desnivel</span>
            </div>
            <span className="text-lg font-bold text-primary">{desnivel.toLocaleString("es-CL")} m D+</span>
          </div>
          <Slider min={0} max={4000} step={100} value={[desnivel]} onValueChange={([v]) => setDesnivel(v)} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 m</span><span>4,000 m</span>
          </div>
        </div>

        {/* Tiempo estimado */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Tiempo estimado</span>
          </div>
          <span className="text-lg font-bold">{tiempo}</span>
        </div>
      </motion.div>

      {/* Fecha y hora */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Fecha y hora de salida</p>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          {/* Calendario 3 semanas */}
          <div className="grid grid-cols-7 gap-1">
            {diasSemana.map((d) => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium pb-1">{d}</div>
            ))}
            {/* Offset inicial */}
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((d) => (
              <button
                key={toISO(d)}
                onClick={() => setFecha(d)}
                className={`aspect-square rounded-lg text-[11px] font-medium transition-all flex flex-col items-center justify-center leading-none gap-0.5
                  ${isSelected(d) ? "gradient-energy text-primary-foreground" : isToday(d) ? "border border-primary text-primary" : "text-foreground active:bg-muted"}`}
              >
                <span>{d.getDate()}</span>
                {isToday(d) && !isSelected(d) && <span className="text-[8px] text-primary">hoy</span>}
              </button>
            ))}
          </div>
          {/* Fecha seleccionada + hora */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {fecha.getDate()} {meses[fecha.getMonth()]} · {diasSemana[fecha.getDay()]}
            </span>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="text-xs font-semibold bg-muted rounded-lg px-2 py-1 border-0 outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Clima */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Condiciones</p>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          {!coords ? (
            <p className="text-xs text-muted-foreground">Activa la ubicación para ver el clima</p>
          ) : !weather ? (
            <p className="text-xs text-muted-foreground">Sin datos de clima para esta fecha</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">{weather.temp}°C</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">{weather.precip}% lluvia</span>
                </div>
              </div>
              {weather.temp > 28 && (
                <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
                  <Droplets className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">Día caluroso — agrega 1 bidón extra de agua</span>
                </div>
              )}
              {weather.precip > 60 && (
                <div className="flex items-center gap-2 bg-accent/10 rounded-xl px-3 py-2">
                  <CloudRain className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-xs text-accent font-medium">Lluvia probable — considera ropa impermeable</span>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <div className="pb-2">
        <button
          onClick={handleConfirm}
          className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Armar kit <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StravaView({
  token,
  onBack,
  onDisconnect,
}: {
  token: string | null;
  onBack: () => void;
  onDisconnect: () => void;
}) {
  const navigate = useNavigate();
  const { data: activities, isLoading, isError } = useStravaActivities(token);
  const [selected, setSelected] = useState<StravaActivity | null>(null);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-12">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Cargando actividades...</p>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-destructive">No se pudieron cargar las actividades.</p>
        <button onClick={onBack} className="text-xs text-primary underline">Volver</button>
      </motion.div>
    );
  }

  const rides = activities?.filter((a) => a.type === "Ride") ?? [];

  if (!selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Últimas rutas ({rides.length})
          </p>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1 text-[10px] text-muted-foreground active:text-destructive transition-colors"
          >
            <Unlink className="w-3 h-3" /> Desconectar
          </button>
        </div>

        {rides.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No hay rutas recientes en Strava.</p>
        ) : (
          <div className="space-y-2">
            {rides.map((activity, i) => (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(activity)}
                className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 active:border-primary transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{activity.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistance(activity.distance)} · {formatElevation(activity.total_elevation_gain)} · {formatMovingTime(activity.moving_time)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Selected activity detail
  const km = Math.round(selected.distance / 1000);
  const secciones = generarSecciones(km);
  const tiempo = formatMovingTime(selected.moving_time);

  function handleArmarKit() {
    saveRoute({
      name: selected.name,
      distancia: km,
      desnivel: Math.round(selected.total_elevation_gain),
      tiempo,
      source: "strava",
    });
    navigate("/kit");
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground active:text-foreground">
        ← Volver a actividades
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-bold text-base truncate">{selected.name}</h2>
        <p className="text-xs text-muted-foreground">
          {new Date(selected.start_date_local).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Distancia", value: formatDistance(selected.distance) },
          { icon: Mountain, label: "Desnivel", value: formatElevation(selected.total_elevation_gain) },
          { icon: Clock, label: "Tiempo", value: tiempo },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-xl p-3 text-center"
          >
            <s.icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secciones */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Secciones sugeridas</p>
        <div className="space-y-2">
          {secciones.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg gradient-energy text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                {s.id}
              </div>
              <div>
                <p className="font-medium text-xs">Sección {s.id}</p>
                <p className="text-[10px] text-muted-foreground">{s.km} km</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleArmarKit}
        className="w-full gradient-energy text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        Armar kit para esta ruta <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

const ProximaSalida = () => {
  const navigate = useNavigate();
  const { isConnected: googleConnected, connect: connectGoogle } = useAuth();
  const { token: stravaToken, disconnect: disconnectStrava } = useStravaAuth();
  const [mode, setMode] = useState<Mode>("manual");

  const subtitles: Record<Mode, string> = {
    empty: "Planifica tu nutrición para esta ruta",
    manual: "Ajusta los parámetros de tu ruta",
    google: "Tus actividades de Google",
    strava: "Tus actividades de Strava",
  };

  function handleGoogleAction() {
    if (googleConnected) {
      setMode("manual");
    } else {
      connectGoogle();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold mb-1">Próxima Salida</h1>
          <p className="text-xs text-muted-foreground">{subtitles[mode]}</p>
        </div>
        {mode === "strava" && (
          <button
            onClick={() => setMode("manual")}
            className="text-xs text-muted-foreground active:text-foreground transition-colors"
          >
            Manual
          </button>
        )}
      </motion.div>

      {mode === "manual" && (
        <ManualView
          onBack={() => setMode("empty")}
          onConfirm={() => navigate("/kit")}
        />
      )}

      {mode === "strava" && (
        <StravaView
          token={stravaToken}
          onBack={() => setMode("empty")}
          onDisconnect={() => { disconnectStrava(); setMode("empty"); }}
        />
      )}
    </div>
  );
};

export default ProximaSalida;
