import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Perfil from "@/pages/Perfil";
import ProximaSalida from "@/pages/ProximaSalida";
import Kit from "@/pages/Kit";
import Compras from "@/pages/Compras";
import Calculadora from "@/pages/Calculadora";
import Marketplace from "@/pages/Marketplace";
import StravaCallback from "@/pages/StravaCallback";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/salida" element={<ProximaSalida />} />
            <Route path="/kit" element={<Kit />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/calculadora" element={<Calculadora />} />
            <Route path="/suscripcion" element={<Marketplace />} />
          </Route>
          <Route path="/strava/callback" element={<StravaCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
