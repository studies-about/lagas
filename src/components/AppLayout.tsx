import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, User, Bike, Package, ShoppingCart, Calculator } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";

const navItems = [
  { to: "/", icon: Home, label: "LAGAS" },
  { to: "/perfil", icon: User, label: "Perfil" },
  { to: "/salida", icon: Bike, label: "Salida" },
  { to: "/kit", icon: Package, label: "Kit" },
  { to: "/compras", icon: ShoppingCart, label: "Compras" },
  { to: "/calculadora", icon: Calculator, label: "Nutrición" },
];

const pathOrder = ["/", "/perfil", "/salida", "/kit", "/compras", "/calculadora"];

const pageVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%" }),
};

const AppLayout = () => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const currentIndex = pathOrder.indexOf(location.pathname);
  const prevIndex = pathOrder.indexOf(prevPath.current);
  // 1 = going right, -1 = going left, 0 = same (fallback)
  const direction = currentIndex === prevIndex ? 0 : currentIndex > prevIndex ? 1 : -1;

  // Update ref after computing direction (runs after render)
  const pathForRef = location.pathname;
  setTimeout(() => { prevPath.current = pathForRef; }, 0);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background relative">
      {/* Main content — clips sliding pages */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-24"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-0.5 py-1 px-2 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-1.5 w-5 h-0.5 rounded-full gradient-energy"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
        <div className="h-safe-bottom" />
      </nav>
    </div>
  );
};

export default AppLayout;
