import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  gradient?: boolean;
}

const StatCard = ({ icon: Icon, label, value, sub, gradient }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-xl p-5 ${
      gradient
        ? "gradient-energy text-primary-foreground"
        : "bg-card border border-border"
    }`}
  >
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 opacity-70" />
      <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
  </motion.div>
);

export default StatCard;
