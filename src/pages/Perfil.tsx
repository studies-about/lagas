import { motion } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  cyclist_type: string | null;
  age_range: string | null;
  weekly_km: number | null;
  dietary_type: string | null;
}

const Perfil = () => {
  const { user, isConnected, connect, disconnect } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, avatar_url, cyclist_type, age_range, weekly_km, dietary_type")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold mb-1">Perfil Ciclista</h1>
          <p className="text-xs text-muted-foreground">Inicia sesión para ver tu perfil</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">Sin sesión activa</p>
            <p className="text-xs text-muted-foreground mt-1">Conecta tu cuenta para guardar tu perfil</p>
          </div>
          <button
            onClick={connect}
            className="w-full gradient-energy text-primary-foreground py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1">Perfil Ciclista</h1>
          <p className="text-xs text-muted-foreground">Tu nivel, objetivos y preferencias alimentarias</p>
        </div>
        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 text-xs text-muted-foreground active:text-destructive transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>
      </motion.div>

      {/* Avatar + nombre */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold text-sm">{profile?.name ?? user?.user_metadata?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{profile?.email ?? user?.email ?? "—"}</p>
        </div>
      </motion.div>

      {/* Datos del perfil */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Datos del ciclista</h2>
        </div>
        <div className="space-y-2">
          {[
            ["Tipo de ciclista", profile?.cyclist_type],
            ["Rango de edad", profile?.age_range],
            ["Km semanales", profile?.weekly_km ? `${profile.weekly_km} km` : null],
            ["Alimentación", profile?.dietary_type],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between text-sm">
              <span className="text-muted-foreground text-xs">{label as string}</span>
              <span className="font-medium text-xs">{(value as string) ?? <span className="text-muted-foreground italic">Sin completar</span>}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Perfil;
