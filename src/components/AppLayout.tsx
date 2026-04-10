import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, User, Bike, Package, ShoppingCart, Calculator } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/perfil", icon: User, label: "Perfil" },
  { to: "/salida", icon: Bike, label: "Salida" },
  { to: "/kit", icon: Package, label: "Kit" },
  { to: "/compras", icon: ShoppingCart, label: "Compras" },
  { to: "/calculadora", icon: Calculator, label: "Nutrición" },
];

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background relative">
      {/* Main content — scrollable area above bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <Outlet />
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
        {/* Safe area for phones with home indicator */}
        <div className="h-safe-bottom" />
      </nav>
    </div>
  );
};

export default AppLayout;
