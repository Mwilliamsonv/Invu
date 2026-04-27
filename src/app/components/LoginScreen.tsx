import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../providers/AuthProvider";

export function LoginScreen() {
  const navigate = useNavigate();
  const { loginEmail, loginGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    try {
      setLoading(true);
      setError(null);
      await loginGoogle();
      navigate("/home");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await loginEmail(email, password);
      navigate("/home");
    } catch (e: any) {
      setError(e?.message ?? "Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "#e8ecf0" }}
    >
      <div className="w-full max-w-[390px] min-h-screen px-8 py-12 flex flex-col justify-center">
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#3d4a5c", marginBottom: 4 }}>
          Iniciar sesión
        </h1>
        <p style={{ color: "#8a9bb0", marginBottom: 24 }}>
          Accede a tus eventos y lista de invitados.
        </p>

        {error && (
          <div
            className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <button
          onClick={onGoogle}
          disabled={loading}
          className="w-full py-4 rounded-2xl mb-4 flex items-center justify-center gap-3"
          style={{
            background: "#e8ecf0",
            boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            color: "#4a5568",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.4c-.24 1.25-.96 2.3-2.04 3.02l3.3 2.56c1.92-1.77 3.03-4.37 3.03-7.48 0-.72-.06-1.42-.2-2.1H12z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.3-2.56c-.92.62-2.1.99-3.31.99-2.55 0-4.71-1.73-5.49-4.06H3.1v2.64A10 10 0 0 0 12 22z"
            />
            <path
              fill="#FBBC05"
              d="M6.51 13.93A6 6 0 0 1 6.2 12c0-.67.11-1.31.31-1.93V7.43H3.1A10 10 0 0 0 2 12c0 1.61.38 3.13 1.1 4.5l3.41-2.57z"
            />
            <path
              fill="#4285F4"
              d="M12 5.98c1.47 0 2.8.5 3.84 1.47l2.88-2.88C16.95 2.93 14.7 2 12 2A10 10 0 0 0 3.1 7.43l3.41 2.64c.78-2.33 2.94-4.09 5.49-4.09z"
            />
          </svg>
          Continuar con Google
        </button>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-2xl px-4 py-4 outline-none"
            style={{
              border: "none",
              background: "#e8ecf0",
              boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff",
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-2xl px-4 py-4 outline-none"
            style={{
              border: "none",
              background: "#e8ecf0",
              boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl mt-1"
            style={{
              background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p style={{ marginTop: 16, color: "#8a9bb0", fontSize: 14 }}>
          ¿No tienes cuenta?{" "}
          <Link to="/register" style={{ color: "#00acc1", fontWeight: 700 }}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
