import { motion } from "framer-motion";
import { User, LogOut, Pencil, Check, X, Trash2 } from "lucide-react";
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

const cyclistOptions = ["amateur", "entrenado", "competitivo"];
const ageOptions = ["18-25", "26-35", "36-45", "46-55", "56+"];
const dietOptions = ["omnivoro", "vegetariano", "vegano"];

const Perfil = () => {
  const { user, isConnected, connect, disconnect } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, avatar_url, cyclist_type, age_range, weekly_km, dietary_type")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update(draft).eq("id", user.id);
    setProfile((p) => p ? { ...p, ...draft } : p);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!user) return;
    await supabase.from("profiles").delete().eq("id", user.id);
    disconnect();
  }

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
          <p className="text-xs text-muted-foreground">Tu nivel y preferencias alimentarias</p>
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

      {/* Datos editables */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Datos del ciclista</h2>
          </div>
          {!editing ? (
            <button onClick={() => { setDraft({}); setEditing(true); }} className="flex items-center gap-1 text-xs text-primary">
              <Pencil className="w-3 h-3" /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs text-primary font-semibold">
                <Check className="w-3.5 h-3.5" /> {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Tipo de ciclista */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Tipo de ciclista</p>
            {editing ? (
              <div className="flex gap-1.5 flex-wrap">
                {cyclistOptions.map((o) => (
                  <button key={o} onClick={() => setDraft((d) => ({ ...d, cyclist_type: o }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(draft.cyclist_type ?? profile?.cyclist_type) === o ? "gradient-energy text-primary-foreground" : "bg-muted"}`}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">{profile?.cyclist_type ?? <span className="text-muted-foreground text-xs italic">Sin completar</span>}</p>
            )}
          </div>

          {/* Rango de edad */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Rango de edad</p>
            {editing ? (
              <div className="flex gap-1.5 flex-wrap">
                {ageOptions.map((o) => (
                  <button key={o} onClick={() => setDraft((d) => ({ ...d, age_range: o }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(draft.age_range ?? profile?.age_range) === o ? "gradient-energy text-primary-foreground" : "bg-muted"}`}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">{profile?.age_range ?? <span className="text-muted-foreground text-xs italic">Sin completar</span>}</p>
            )}
          </div>

          {/* Km semanales */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Km semanales</p>
            {editing ? (
              <input
                type="number"
                placeholder="ej: 200"
                defaultValue={profile?.weekly_km ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, weekly_km: parseInt(e.target.value) || null }))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm border-0 outline-none"
              />
            ) : (
              <p className="text-sm font-medium">{profile?.weekly_km ? `${profile.weekly_km} km` : <span className="text-muted-foreground text-xs italic">Sin completar</span>}</p>
            )}
          </div>

          {/* Alimentación */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Tipo de alimentación</p>
            {editing ? (
              <div className="flex gap-1.5 flex-wrap">
                {dietOptions.map((o) => (
                  <button key={o} onClick={() => setDraft((d) => ({ ...d, dietary_type: o }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(draft.dietary_type ?? profile?.dietary_type) === o ? "gradient-energy text-primary-foreground" : "bg-muted"}`}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">{profile?.dietary_type ?? <span className="text-muted-foreground text-xs italic">Sin completar</span>}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Eliminar cuenta */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-destructive py-3 rounded-xl border border-destructive/20 active:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar cuenta
          </button>
        ) : (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-destructive">¿Eliminar tu cuenta?</p>
            <p className="text-xs text-muted-foreground">Se borrarán tus rutas y datos. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-card border border-border py-2.5 rounded-xl text-xs font-semibold">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-xs font-semibold">
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Perfil;
