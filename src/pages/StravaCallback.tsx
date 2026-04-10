import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeViaServer, storeTokens } from "@/lib/stravaAuth";
import { motion } from "framer-motion";

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam || !code) {
      setError("Acceso denegado. Intenta conectar Strava de nuevo.");
      return;
    }

    exchangeCodeViaServer(code)
      .then((data) => {
        storeTokens(data.access_token, data.expires_at);
        navigate("/salida", { replace: true });
      })
      .catch(() => {
        setError("No se pudo conectar con Strava. Verifica tus credenciales.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => navigate("/salida", { replace: true })}
            className="text-primary text-sm underline"
          >
            Volver
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Conectando con Strava...</p>
        </motion.div>
      )}
    </div>
  );
};

export default StravaCallback;
