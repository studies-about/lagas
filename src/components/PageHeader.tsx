import { motion } from "framer-motion";

interface PageHeaderProps {
  icon: string;
  title: string;
  description: string;
}

const PageHeader = ({ icon, title, description }: PageHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
    </div>
    <p className="text-muted-foreground max-w-2xl">{description}</p>
  </motion.div>
);

export default PageHeader;
