import { motion } from "framer-motion";
import { ShoppingBag, Star, Zap, CalendarCheck } from "lucide-react";

const kits = [
  { id: 1, name: "Kit < 70K", desc: "Salida corta: geles, barrita y bidón.", price: "$12.900", rating: 4.7, items: 5, popular: false },
  { id: 2, name: "Kit 100K", desc: "Media distancia con geles e isotónico.", price: "$18.900", rating: 4.5, items: 8, popular: false },
  { id: 3, name: "Kit 200K", desc: "Alimentación completa para brevets 200 km.", price: "$24.900", rating: 4.8, items: 12, popular: true },
  { id: 4, name: "Kit 300K", desc: "Kit extendido con sólidos y líquidos.", price: "$38.500", rating: 4.6, items: 18, popular: false },
  { id: 5, name: "Kit 400K", desc: "Ultra-distancia con comida nocturna.", price: "$52.000", rating: 4.9, items: 25, popular: false },
];

const subscriptions = [
  {
    name: "Plan Randonneur",
    price: "$19.900/mes",
    features: ["1 kit mensual personalizado", "Personalización por perfil", "Acceso a calculadora pro"],
  },
  {
    name: "Plan Super Randonneur",
    price: "$34.900/mes",
    features: ["2 kits mensuales", "Vinculado a calendario brevets", "Recomendaciones IA", "Soporte prioritario"],
    highlighted: true,
  },
];

const Marketplace = () => (
  <div className="space-y-4">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-xl font-bold mb-1">📦 Kit / Suscripción</h1>
      <p className="text-xs text-muted-foreground">Kits prediseñados y suscripciones para brevets</p>
    </motion.div>

    {/* Kits */}
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Kits por salida</p>
      <div className="space-y-2">
        {kits.map((kit, i) => (
          <motion.div
            key={kit.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-xl p-4 relative overflow-hidden active:border-primary transition-colors"
          >
            {kit.popular && (
              <span className="absolute top-3 right-3 gradient-energy text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <Zap className="w-3 h-3" /> Popular
              </span>
            )}
            <h3 className="font-bold text-sm">{kit.name}</h3>
            <p className="text-[10px] text-muted-foreground mb-2">{kit.desc}</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-base font-bold text-primary">{kit.price}</span>
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Star className="w-3 h-3 text-primary fill-primary" /> {kit.rating}
              </span>
              <span className="text-[10px] text-muted-foreground">{kit.items} items</span>
            </div>
            <button className="w-full bg-primary/10 text-primary py-2 rounded-lg text-xs font-medium active:bg-primary active:text-primary-foreground transition-colors">
              <ShoppingBag className="w-3.5 h-3.5 inline mr-1" /> Agregar
            </button>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Subscriptions */}
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CalendarCheck className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suscripciones</p>
      </div>
      <div className="space-y-2">
        {subscriptions.map((sub, i) => (
          <motion.div
            key={sub.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className={`rounded-2xl p-4 ${
              sub.highlighted
                ? "gradient-dark text-primary-foreground border-2 border-primary"
                : "bg-card border border-border"
            }`}
          >
            <h3 className="font-bold text-sm mb-0.5">{sub.name}</h3>
            <p className={`text-xl font-bold mb-3 ${sub.highlighted ? "text-gradient-energy" : "text-primary"}`}>
              {sub.price}
            </p>
            <ul className="space-y-1.5 mb-4">
              {sub.features.map((f) => (
                <li key={f} className="text-xs flex items-center gap-1.5">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2.5 rounded-xl text-xs font-medium transition-colors active:scale-[0.98] ${
                sub.highlighted
                  ? "gradient-energy text-primary-foreground"
                  : "border border-border active:border-primary active:text-primary"
              }`}
            >
              Suscribirme
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default Marketplace;
