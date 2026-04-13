import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Store, CheckCircle2, Save, CheckCheck, X, Package, ArrowRight, User, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoute, getKitConfig, generarSecciones, buildSectionItems, saveComprasProgress, saveComprasChecked, getComprasChecked } from "@/lib/routeStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// ─── store mapping ────────────────────────────────────────────────────────────

const storeMap: Record<string, string> = {
  "Gel de maltodextrina": "Lista",
  "Gel de cafeína": "Lista",
  "Barrita energética": "Decathlon",
  "Barrita de arroz": "Supermercado",
  "Bidón isotónico": "Lista",
  "Plátano (en control)": "Verdulería",
  "Frutos secos mix": "Supermercado",
  "Bocadillo dulce membrillo": "Supermercado",
};

const KIT_ITEMS_LABEL: Record<string, string> = {
  "Gel de maltodextrina": "Geles energéticos",
  "Gel de cafeína": "Geles con cafeína",
  "Barrita energética": "Barritas energéticas",
  "Barrita de arroz": "Barritas de arroz",
  "Bidón isotónico": "Isotónico en polvo",
  "Frutos secos mix": "Mix frutos secos",
  "Bocadillo dulce membrillo": "Bocadillos de membrillo",
};

const PRECIO_KIT = 19900;
const PRECIO_SUB = 34900;

// ─── aggregation ──────────────────────────────────────────────────────────────

function buildShoppingList(distancia: number, desnivel: number, carbTarget: ReturnType<typeof getKitConfig>) {
  const secciones = generarSecciones(distancia);
  const counts = new Map<string, number>();

  for (const s of secciones) {
    const secDesnivel = Math.round(desnivel * (s.km / distancia));
    const items = buildSectionItems(s.km, secDesnivel, carbTarget);
    for (const item of items) {
      if (item.storage === "ruta") continue;
      const match = item.qty.match(/^(\d+)x$/);
      const qty = match ? parseInt(match[1]) : 1;
      counts.set(item.name, (counts.get(item.name) ?? 0) + qty);
    }
  }

  return Array.from(counts.entries()).map(([name, qty], i) => ({
    id: i + 1,
    name,
    qty: `${qty}x`,
    store: storeMap[name] ?? "Varios",
    checked: false,
  }));
}

function buildKitLines(distancia: number, desnivel: number, carbTarget: ReturnType<typeof getKitConfig>) {
  const secciones = generarSecciones(distancia);
  const counts = new Map<string, number>();
  for (const s of secciones) {
    const secDesnivel = Math.round(desnivel * (s.km / distancia));
    const items = buildSectionItems(s.km, secDesnivel, carbTarget);
    for (const item of items) {
      if (item.storage === "ruta") continue;
      if (item.name.includes("Bidón")) continue; // bidones no van en el kit
      const match = item.qty.match(/^(\d+)x$/);
      const qty = match ? parseInt(match[1]) : 1;
      counts.set(item.name, (counts.get(item.name) ?? 0) + qty);
    }
  }
  return Array.from(counts.entries()).map(([name, qty]) => ({
    name,
    label: KIT_ITEMS_LABEL[name] ?? name,
    qty,
  }));
}

// ─── checkout modal ───────────────────────────────────────────────────────────

type KitType = "unico" | "sub";
type CheckoutStep = "carrito" | "datos" | "resumen";

interface DatosForm {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
}

function CheckoutModal({
  kitLines,
  onClose,
}: {
  kitLines: { name: string; label: string; qty: number }[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<CheckoutStep>("carrito");
  const [kitType, setKitType] = useState<KitType>("unico");
  const [datos, setDatos] = useState<DatosForm>({
    nombre: "", email: "", telefono: "", direccion: "", comuna: "",
  });

  const precio = kitType === "unico" ? PRECIO_KIT : PRECIO_SUB;
  const despacho = 3990;
  const total = precio + (kitType === "unico" ? despacho : 0);

  const datosOk = datos.nombre && datos.email && datos.telefono && datos.direccion && datos.comuna;

  // ── step: carrito ──
  function StepCarrito() {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tipo de kit</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "unico" as KitType, label: "Kit Único", price: PRECIO_KIT, sub: "Entrega única" },
              { key: "sub" as KitType, label: "Suscripción", price: PRECIO_SUB, sub: "Cada mes · Despacho gratis" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setKitType(opt.key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  kitType === opt.key
                    ? "gradient-energy border-transparent"
                    : "bg-card border-border"
                }`}
              >
                <p className={`text-xs font-bold ${kitType === opt.key ? "text-primary-foreground" : ""}`}>{opt.label}</p>
                <p className={`text-base font-bold mt-0.5 ${kitType === opt.key ? "text-primary-foreground" : "text-primary"}`}>
                  ${opt.price.toLocaleString("es-CL")}
                </p>
                <p className={`text-[10px] mt-0.5 ${kitType === opt.key ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Incluye</p>
          <div className="bg-muted/50 rounded-xl divide-y divide-border/50">
            {kitLines.map((line) => (
              <div key={line.name} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs">{line.label}</span>
                <span className="text-xs font-semibold text-primary">{line.qty}u</span>
              </div>
            ))}
            {kitLines.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-3 text-center">Sin productos calculados</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Kit {kitType === "unico" ? "único" : "mensual"}</span>
            <span className="font-semibold">${precio.toLocaleString("es-CL")}</span>
          </div>
          {kitType === "unico" && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Despacho</span>
              <span className="font-semibold">${despacho.toLocaleString("es-CL")}</span>
            </div>
          )}
          {kitType === "sub" && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Despacho</span>
              <span className="font-semibold text-accent">Gratis</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary">${total.toLocaleString("es-CL")}</span>
          </div>
        </div>

        <button
          onClick={() => setStep("datos")}
          className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── step: datos ──
  function StepDatos() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {([
            { key: "nombre", label: "Nombre completo", placeholder: "Juan Pérez", icon: User },
            { key: "email", label: "Correo electrónico", placeholder: "juan@correo.cl", icon: CreditCard, type: "email" },
            { key: "telefono", label: "Teléfono", placeholder: "+56 9 1234 5678", icon: User, type: "tel" },
            { key: "direccion", label: "Dirección de despacho", placeholder: "Av. Providencia 123, Depto 4B", icon: MapPin },
            { key: "comuna", label: "Comuna", placeholder: "Providencia", icon: MapPin },
          ] as { key: keyof DatosForm; label: string; placeholder: string; icon: typeof User; type?: string }[]).map((field) => (
            <div key={field.key}>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {field.label}
              </label>
              <input
                type={field.type ?? "text"}
                value={datos[field.key]}
                onChange={(e) => setDatos((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep("resumen")}
          disabled={!datosOk}
          className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ver resumen <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── step: resumen ──
  function StepResumen() {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Pedido</p>
            <p className="text-sm font-bold">Kit {kitType === "unico" ? "Único" : "Suscripción mensual"}</p>
            <p className="text-xs text-muted-foreground">{kitLines.length} productos · {kitLines.reduce((a, l) => a + l.qty, 0)} unidades</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Despacho</p>
            <p className="text-sm font-medium">{datos.nombre}</p>
            <p className="text-xs text-muted-foreground">{datos.direccion}, {datos.comuna}</p>
            <p className="text-xs text-muted-foreground">{datos.telefono} · {datos.email}</p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-bold">Total a pagar</p>
            <p className="text-lg font-bold text-primary">${total.toLocaleString("es-CL")}</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Serás redirigido a <strong>WebPay</strong> para pagar con tarjeta de débito (Redcompra) o crédito (Visa, Mastercard, AmEx).
          </p>
        </div>

        {/*
          INTEGRACIÓN PAGO:
          Al hacer click, llamar a tu endpoint:
          POST /api/create-order → { token, url } de Flow o Transbank
          Luego: window.location.href = `${url}?token_ws=${token}`
        */}
        <button
          onClick={() => {
            // TODO: llamar a /api/create-order con { kitType, total, datos }
            alert("Integración de pago pendiente — conectar Flow o Transbank WebPay");
          }}
          className="w-full gradient-energy text-primary-foreground py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <CreditCard className="w-4 h-4" />
          Pagar ${total.toLocaleString("es-CL")} con WebPay
        </button>
      </div>
    );
  }

  const stepTitles: Record<CheckoutStep, string> = {
    carrito: "Tu kit LAGAS",
    datos: "Datos de despacho",
    resumen: "Confirmar pedido",
  };

  const stepBack: Partial<Record<CheckoutStep, CheckoutStep>> = {
    datos: "carrito",
    resumen: "datos",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="relative w-full max-w-md bg-background rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {stepBack[step] && (
              <button
                onClick={() => setStep(stepBack[step]!)}
                className="text-[10px] text-muted-foreground active:text-foreground"
              >
                ← Volver
              </button>
            )}
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">{stepTitles[step]}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicators */}
            <div className="flex gap-1">
              {(["carrito", "datos", "resumen"] as CheckoutStep[]).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? "w-4 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              {step === "carrito" && <StepCarrito />}
              {step === "datos" && <StepDatos />}
              {step === "resumen" && <StepResumen />}
            </motion.div>
          </AnimatePresence>
          <div className="h-safe-bottom" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function NoRoute() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🛒</div>
      <div>
        <h2 className="font-bold text-base">Sin lista generada</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
          Configura tu ruta y arma tu kit para generar la lista de compra
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

const Compras = () => {
  const navigate = useNavigate();
  const route = getRoute();
  const carbTarget = getKitConfig();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const initial = route
    ? (() => {
        const list = buildShoppingList(route.distancia, route.desnivel, carbTarget);
        const checked = new Set(getComprasChecked(route.id));
        return list.map(it => ({ ...it, checked: checked.has(it.name) }));
      })()
    : [];
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: number) => {
    const newItems = items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
    setItems(newItems);
    if (route?.id) {
      const newChecked = newItems.filter((i) => i.checked).length;
      saveComprasProgress(route.id, newChecked, newItems.length);
      saveComprasChecked(route.id, newItems.filter((i) => i.checked).map((i) => i.name));
    }
  };

  const checked = items.filter((i) => i.checked).length;

  const byStore = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.store] ??= []).push(item);
    return acc;
  }, {});

  const kitLines = route ? buildKitLines(route.distancia, route.desnivel, carbTarget) : [];

  async function handleSaveRoute() {
    if (!route || !user) return;
    setSaving(true);
    await supabase.from("routes").upsert({
      user_id: user.id,
      name: route.name,
      distance_km: route.distancia,
      elevation_m: route.desnivel,
      date: route.fecha ?? null,
      strava_id: null,
    }, { onConflict: "user_id,strava_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/"), 1500);
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Lista de Compra</h1>
        <p className="text-xs text-muted-foreground">Generada desde tu kit · {carbTarget}</p>
      </motion.div>

      {!route ? <NoRoute /> : (
        <>
          {/* Route + progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="gradient-dark px-4 py-2.5 flex items-center justify-between">
              <p className="text-primary-foreground font-semibold text-xs truncate">{route.name}</p>
              <span className="text-[10px] text-primary-foreground/50 shrink-0 ml-2">
                {route.distancia} km · {route.desnivel.toLocaleString("es-CL")} m D+
              </span>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progreso de compra</span>
                  <span>{checked}/{items.length}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex gap-2">
            {user ? (
              <button
                onClick={handleSaveRoute}
                disabled={saving || saved}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  saved
                    ? "bg-green-500/10 text-green-600 border border-green-500/30"
                    : "bg-card border border-border active:border-primary"
                }`}
              >
                {saved ? <CheckCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Guardada" : saving ? "Guardando..." : "Guardar ruta"}
              </button>
            ) : (
              <button
                onClick={() => navigate("/perfil")}
                className="flex-1 bg-card border border-border py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:border-primary transition-colors"
              >
                <Save className="w-4 h-4" />
                Iniciar sesión para guardar
              </button>
            )}

            <button
              onClick={() => setCheckoutOpen(true)}
              className="flex-1 gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Package className="w-4 h-4" />
              Kit LAGAS
            </button>
          </motion.div>

          {/* Items agrupados por tienda */}
          {Object.entries(byStore).map(([store, storeItems], gi) => (
            <motion.div
              key={store}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + gi * 0.05 }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Store className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{store}</p>
              </div>
              <div className="space-y-1.5">
                {storeItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    onClick={() => toggle(item.id)}
                    className={`w-full bg-card border rounded-xl px-4 py-3 flex items-center gap-2.5 text-left transition-all active:scale-[0.98] ${
                      item.checked ? "border-primary/30 opacity-60" : "border-border"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.checked ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`flex-1 text-xs ${item.checked ? "line-through text-muted-foreground" : "font-medium"}`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.qty}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Banner LAGAS al fondo */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setCheckoutOpen(true)}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 active:border-primary transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl gradient-energy flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">¿No quieres comprar todo solo?</p>
              <p className="text-xs text-muted-foreground">Recibe tu kit calculado directo en casa</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        </>
      )}

      {/* Checkout modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutModal
            kitLines={kitLines}
            onClose={() => setCheckoutOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Compras;
