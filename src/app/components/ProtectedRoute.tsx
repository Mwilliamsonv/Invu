import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../providers/AuthProvider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "#e8ecf0", color: "#6b7a8d", fontWeight: 600 }}
      >
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
