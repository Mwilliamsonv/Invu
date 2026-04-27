import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../providers/AuthProvider";

export function RegisterScreen() {
  const navigate = useNavigate();
  const { registerEmail } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await registerEmail(name, email, password);
      navigate("/home");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear la cuenta.");
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
          Crear cuenta
        </h1>
        <p style={{ color: "#8a9bb0", marginBottom: 24 }}>
          Regístrate para administrar tus eventos.
        </p>

        {error && (
          <div
            className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-2xl px-4 py-4 outline-none"
            style={{
              border: "none",
              background: "#e8ecf0",
              boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff",
            }}
          />
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
            minLength={6}
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
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
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
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p style={{ marginTop: 16, color: "#8a9bb0", fontSize: 14 }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/" style={{ color: "#00acc1", fontWeight: 700 }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
