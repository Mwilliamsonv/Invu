import { useState } from "react";
import { useNavigate } from "react-router";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    navigate("/home");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "#e8ecf0" }}
    >
      {/* Mobile container */}
      <div
        className="w-full max-w-[390px] min-h-screen flex flex-col items-center justify-center px-8 py-12"
        style={{ background: "#e8ecf0" }}
      >
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{
              background: "#e8ecf0",
              boxShadow: "8px 8px 16px #b8bec7, -8px -8px 16px #ffffff",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" fill="#26c6da" opacity="0.15" />
              <path
                d="M12 20 C12 14, 28 14, 28 20 C28 26, 12 26, 12 20 Z"
                fill="none"
                stroke="#26c6da"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="20" r="4" fill="#26c6da" />
              <path
                d="M20 10 L20 13 M20 27 L20 30 M10 20 L13 20 M27 20 L30 20"
                stroke="#26c6da"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1
            className="text-[#4a5568]"
            style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.3px" }}
          >
            Bienvenido
          </h1>
          <p style={{ fontSize: "14px", color: "#8a9bb0", marginTop: "4px" }}>
            Inicia sesión para continuar
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-6 transition-all duration-150 active:scale-[0.97]"
          style={{
            background: "#e8ecf0",
            boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff",
            border: "none",
            cursor: "pointer",
            color: "#4a5568",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff";
          }}
        >
          {/* Google Icon */}
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            Continuar con Google
          </span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(to right, transparent, #b8bec7)" }}
          />
          <span style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500 }}>
            o
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(to left, transparent, #b8bec7)" }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, paddingLeft: "4px" }}
            >
              Correo electrónico
            </label>
            <div
              className="flex items-center rounded-2xl px-4 py-4 gap-3 transition-all duration-200"
              style={{
                background: "#e8ecf0",
                boxShadow:
                  focusedField === "email"
                    ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                    : "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"
                  stroke={focusedField === "email" ? "#26c6da" : "#a0aec0"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 6L12 13L2 6"
                  stroke={focusedField === "email" ? "#26c6da" : "#a0aec0"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: "15px",
                  color: "#4a5568",
                  border: "none",
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, paddingLeft: "4px" }}
            >
              Contraseña
            </label>
            <div
              className="flex items-center rounded-2xl px-4 py-4 gap-3 transition-all duration-200"
              style={{
                background: "#e8ecf0",
                boxShadow:
                  focusedField === "password"
                    ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                    : "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  stroke={focusedField === "password" ? "#26c6da" : "#a0aec0"}
                  strokeWidth="1.8"
                />
                <path
                  d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11"
                  stroke={focusedField === "password" ? "#26c6da" : "#a0aec0"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1.5" fill={focusedField === "password" ? "#26c6da" : "#a0aec0"} />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: "15px",
                  color: "#4a5568",
                  border: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#a0aec0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="#a0aec0" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#a0aec0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#a0aec0" strokeWidth="1.8"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                color: "#26c6da",
                fontWeight: 500,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl mt-1 transition-all duration-150 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
              boxShadow: "6px 6px 14px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.6)",
              border: "none",
              cursor: "pointer",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "inset 3px 3px 6px rgba(0,120,140,0.4), inset -2px -2px 4px rgba(255,255,255,0.2)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "6px 6px 14px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "6px 6px 14px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.6)";
            }}
          >
            Iniciar sesión
          </button>
        </form>

        {/* Sign up link */}
        <div className="mt-8 flex items-center gap-2">
          <span style={{ fontSize: "14px", color: "#8a9bb0" }}>
            ¿No tienes una cuenta?
          </span>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#26c6da",
              fontWeight: 600,
            }}
          >
            Regístrate
          </button>
        </div>

        {/* Bottom indicator */}
        <div className="mt-10 w-32 h-1 rounded-full" style={{ background: "#b8bec7" }} />
      </div>
    </div>
  );
}