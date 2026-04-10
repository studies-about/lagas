import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const stages = [1, 2, 3, 4, 5];

const plannedItems = [
  { id: 1, name: "Gel de maltodextrina x3", stage: 1 },
  { id: 2, name: "Barrita energética x2", stage: 1 },
  { id: 3, name: "Bidón isotónico 750ml", stage: 1 },
  { id: 4, name: "Gel de cafeína x2", stage: 2 },
  { id: 5, name: "Frutos secos mix", stage: 2 },
  { id: 6, name: "Coca-Cola 500ml", stage: 2 },
  { id: 7, name: "Barrita de arroz x2", stage: 3 },
  { id: 8, name: "Gel de maltodextrina x2", stage: 3 },
  { id: 9, name: "Bidón agua 750ml", stage: 3 },
];

const Registro = () => {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [consumed, setConsumed] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState("");

  const toggleConsumed = (id: number) => {
    setConsumed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <PageHeader
        icon="📝"
        title="Registro Post-Salida"
        description="¿Qué comiste realmente vs. lo planificado? ¿Cómo te sentiste en cada etapa?"
      />

      <div className="max-w-2xl space-y-6">
        {/* Checklist of consumed items */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">¿Qué consumiste?</h2>
          <div className="space-y-2">
            {plannedItems.map((item) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.id * 0.03 }}
                onClick={() => toggleConsumed(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                  consumed[item.id]
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/30 border border-border hover:border-primary/40"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    consumed[item.id] ? "text-primary" : "text-muted-foreground/30"
                  }`}
                />
                <span className={`flex-1 text-sm ${consumed[item.id] ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground">Etapa {item.stage}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stage ratings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">¿Cómo te sentiste en cada etapa?</h2>
          <div className="space-y-4">
            {stages.map((stage) => (
              <motion.div
                key={stage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: stage * 0.05 }}
                className="flex items-center gap-4"
              >
                <span className="text-sm font-medium w-20">Etapa {stage}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings({ ...ratings, [stage]: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (ratings[stage] || 0)
                            ? "text-primary fill-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {ratings[stage] === 5 && "Excelente"}
                  {ratings[stage] === 4 && "Bien"}
                  {ratings[stage] === 3 && "Normal"}
                  {ratings[stage] === 2 && "Mal"}
                  {ratings[stage] === 1 && "Muy mal"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">¿Cumpliste el plan?</h2>
          <div className="grid grid-cols-3 gap-3">
            {["Sí, al 100%", "Parcialmente", "No, cambié todo"].map((option) => (
              <button
                key={option}
                className="border border-border rounded-lg py-3 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Notas libres y calificación general</h2>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Qué aprendiste de esta salida? ¿Qué cambiarías?"
            className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <button className="gradient-energy text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity w-full">
          Guardar registro
        </button>
      </div>
    </div>
  );
};

export default Registro;
