import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Mail, User, LogOut, Check } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

const neuFlat = "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff";
const neuInset = "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff";

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{
        width: 84,
        height: 84,
        borderRadius: 28,
        background: "#e8ecf0",
        boxShadow: neuFlat,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Foto de perfil"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{
            width: 68,
            height: 68,
            borderRadius: 22,
            background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: "#e8ecf0", boxShadow: neuInset }}
    >
      <Icon size={16} color="#26c6da" strokeWidth={2} />
      <div className="flex flex-col flex-1 min-w-0">
        <span
          style={{
            fontSize: 10,
            color: "#a0aec0",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 14,
            color: "#3d4a5c",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function SuccessToast({ message }: { message: string }) {
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{
        background: "#e8ecf0",
        boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff",
        whiteSpace: "nowrap",
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,137,123,0.15)" }}
      >
        <Check size={13} color="#00897b" strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#3d4a5c" }}>{message}</span>
    </div>
  );
}

export function CuentaTab() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const profile = useMemo(() => {
    const fallbackName = user?.email?.split("@")[0] ?? "Usuario";
    return {
      name: user?.displayName?.trim() || fallbackName,
      email: user?.email || "Sin correo",
      photoUrl: user?.photoURL || null,
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setToast("Sesion cerrada");
    navigate("/");
  };

  return (
    <>
      {toast && <SuccessToast message={toast} />}

      <div className="flex flex-col gap-5">
        <div
          className="rounded-3xl p-5 flex items-center gap-4"
          style={{ background: "#e8ecf0", boxShadow: neuFlat }}
        >
          <Avatar name={profile.name} photoUrl={profile.photoUrl} />
          <div className="flex flex-col flex-1 min-w-0">
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#3d4a5c",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile.name}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#8a9bb0",
                fontWeight: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 2,
              }}
            >
              {profile.email}
            </span>
          </div>
        </div>

        <div
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{ background: "#e8ecf0", boxShadow: neuFlat }}
        >
          <div className="flex items-center gap-2 mb-1">
            <User size={15} color="#26c6da" strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#3d4a5c" }}>Mi cuenta</span>
          </div>
          <InfoRow Icon={User} label="Nombre" value={profile.name} />
          <InfoRow Icon={Mail} label="Correo" value={profile.email} />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all active:scale-[0.98]"
          style={{ background: "#e8ecf0", boxShadow: neuFlat, border: "none", cursor: "pointer" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(229,62,62,0.10)" }}
          >
            <LogOut size={18} color="#e53e3e" strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#e53e3e", textAlign: "left" }}>
            Cerrar sesion
          </span>
        </button>
      </div>
    </>
  );
}
