import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Mail,
  Phone,
  Edit3,
  Lock,
  LogOut,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  Shield,
} from "lucide-react";

// ── Neumorphic helpers ────────────────────────────────────────────────────────
const neuFlat    = "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff";
const neuInset   = "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff";
const neuAccent  = "6px 6px 14px rgba(0,172,193,0.35), -3px -3px 8px rgba(255,255,255,0.5)";

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: 84,
        height: 84,
        borderRadius: 28,
        background: "#e8ecf0",
        boxShadow: neuFlat,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 68,
          height: 68,
          borderRadius: 22,
          background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
          boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.25), inset -2px -2px 5px rgba(0,120,140,0.3)",
        }}
      >
        <span style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
          {initials}
        </span>
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4"
      style={{ background: "#e8ecf0", boxShadow: neuFlat }}
    >
      {children}
    </div>
  );
}

// ── Row label + value ─────────────────────────────────────────────────────────
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
        <span style={{ fontSize: "10px", color: "#a0aec0", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.6 }}>
          {label}
        </span>
        <span style={{ fontSize: "14px", color: "#3d4a5c", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Editable field ────────────────────────────────────────────────────────────
function EditableField({
  Icon,
  label,
  value,
  type = "text",
  onChange,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: "11px", color: "#8a9bb0", fontWeight: 500, paddingLeft: 4 }}>{label}</label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{ background: "#e8ecf0", boxShadow: focus ? neuInset : neuFlat }}
      >
        <Icon size={16} color={focus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#3d4a5c",
            fontWeight: 500,
          }}
        />
      </div>
    </div>
  );
}

// ── Password field ────────────────────────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: "11px", color: "#8a9bb0", fontWeight: 500, paddingLeft: 4 }}>{label}</label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{ background: "#e8ecf0", boxShadow: focus ? neuInset : neuFlat }}
      >
        <Lock size={16} color={focus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#3d4a5c",
            fontWeight: 500,
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
        >
          {show
            ? <EyeOff size={16} color="#a0aec0" strokeWidth={2} />
            : <Eye    size={16} color="#a0aec0" strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

// ── Confirm logout dialog ──────────────────────────────────────────────────────
function LogoutDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-8"
      style={{ background: "rgba(60,80,100,0.28)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[320px] rounded-3xl p-6 flex flex-col gap-5"
        style={{ background: "#e8ecf0", boxShadow: "10px 10px 24px #b8bec7, -10px -10px 24px #ffffff" }}
      >
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#e8ecf0", boxShadow: neuFlat }}
          >
            <LogOut size={24} color="#e53e3e" strokeWidth={1.8} />
          </div>
        </div>
        <div className="text-center flex flex-col gap-2">
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
            Cerrar sesión
          </h3>
          <p style={{ fontSize: "14px", color: "#8a9bb0", margin: 0, lineHeight: 1.5 }}>
            ¿Estás seguro que querés salir de tu cuenta?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: "#e8ecf0",
              boxShadow: neuFlat,
              border: "none", borderRadius: 16, padding: "14px",
              cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
              boxShadow: "5px 5px 12px rgba(197,48,48,0.35), -2px -2px 8px rgba(255,255,255,0.5)",
              border: "none", borderRadius: 16, padding: "14px",
              cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <LogOut size={15} color="#fff" strokeWidth={2.2} />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success toast ─────────────────────────────────────────────────────────────
function SuccessToast({ message }: { message: string }) {
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{
        background: "#e8ecf0",
        boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff, 0 0 0 1.5px rgba(38,198,218,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,137,123,0.15)" }}
      >
        <Check size={13} color="#00897b" strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#3d4a5c" }}>{message}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// Mock user data — in a real app this comes from auth context / API
const MOCK_USER = {
  name: "Carlos Herrera",
  email: "carlos.herrera@email.com",
  phone: "+54 11 4567-8901",
};

type ActiveSection = "view" | "edit" | "password";

export function CuentaTab() {
  const navigate = useNavigate();

  // User data state
  const [userData, setUserData] = useState(MOCK_USER);
  const [editName, setEditName]   = useState(MOCK_USER.name);
  const [editEmail, setEditEmail] = useState(MOCK_USER.email);
  const [editPhone, setEditPhone] = useState(MOCK_USER.phone);

  // Password state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // UI state
  const [section, setSection]         = useState<ActiveSection>("view");
  const [showLogout, setShowLogout]   = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const [passError, setPassError]     = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // Save profile
  const handleSaveProfile = () => {
    setUserData({ name: editName, email: editEmail, phone: editPhone });
    setSection("view");
    showToast("Datos actualizados correctamente");
  };

  const handleCancelEdit = () => {
    setEditName(userData.name);
    setEditEmail(userData.email);
    setEditPhone(userData.phone);
    setSection("view");
  };

  // Change password
  const handleSavePassword = () => {
    setPassError(null);
    if (!currentPass) { setPassError("Ingresá tu contraseña actual"); return; }
    if (newPass.length < 6) { setPassError("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if (newPass !== confirmPass) { setPassError("Las contraseñas no coinciden"); return; }
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    setSection("view");
    showToast("Contraseña actualizada correctamente");
  };

  const handleCancelPassword = () => {
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    setPassError(null);
    setSection("view");
  };

  // Logout
  const handleLogout = () => {
    navigate("/");
  };

  return (
    <>
      {toast && <SuccessToast message={toast} />}
      {showLogout && (
        <LogoutDialog onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}

      <div className="flex flex-col gap-5">

        {/* ── Profile header ── */}
        <div
          className="rounded-3xl p-5 flex items-center gap-4"
          style={{ background: "#e8ecf0", boxShadow: neuFlat }}
        >
          <Avatar name={userData.name} />
          <div className="flex flex-col flex-1 min-w-0">
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#3d4a5c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userData.name}
            </span>
            <span style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
              {userData.email}
            </span>
            {/* Edit shortcut */}
            {section === "view" && (
              <button
                onClick={() => setSection("edit")}
                className="flex items-center gap-1.5 mt-3 self-start px-3 py-1.5 rounded-xl"
                style={{
                  background: "rgba(38,198,218,0.10)",
                  boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff",
                  border: "none", cursor: "pointer",
                }}
              >
                <Edit3 size={11} color="#26c6da" strokeWidth={2.2} />
                <span style={{ fontSize: "11px", color: "#26c6da", fontWeight: 600 }}>Editar perfil</span>
              </button>
            )}
          </div>
        </div>

        {/* ── VIEW: My data ── */}
        {section === "view" && (
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <User size={15} color="#26c6da" strokeWidth={2} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#3d4a5c" }}>Mis datos</span>
            </div>
            <InfoRow Icon={User}  label="Nombre completo" value={userData.name}  />
            <InfoRow Icon={Mail}  label="Correo"          value={userData.email} />
            <InfoRow Icon={Phone} label="Teléfono"        value={userData.phone} />
          </SectionCard>
        )}

        {/* ── EDIT: Edit profile form ── */}
        {section === "edit" && (
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <Edit3 size={15} color="#26c6da" strokeWidth={2} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#3d4a5c" }}>Editar datos</span>
            </div>
            <EditableField Icon={User}  label="Nombre completo" value={editName}  onChange={setEditName}  />
            <EditableField Icon={Mail}  label="Correo"          value={editEmail} onChange={setEditEmail} type="email" />
            <EditableField Icon={Phone} label="Teléfono"        value={editPhone} onChange={setEditPhone} type="tel" />
            <div className="flex gap-3 mt-1">
              <button
                onClick={handleCancelEdit}
                style={{
                  flex: 1, background: "#e8ecf0", boxShadow: neuFlat,
                  border: "none", borderRadius: 16, padding: "13px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <X size={15} color="#8a9bb0" strokeWidth={2.2} />
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: neuAccent,
                  border: "none", borderRadius: 16, padding: "13px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Check size={15} color="#fff" strokeWidth={2.2} />
                Guardar
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── PASSWORD: Change password form ── */}
        {section === "password" && (
          <SectionCard>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={15} color="#26c6da" strokeWidth={2} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#3d4a5c" }}>Cambiar contraseña</span>
            </div>
            <PasswordField label="Contraseña actual"     value={currentPass}  onChange={setCurrentPass}  placeholder="••••••••" />
            <PasswordField label="Nueva contraseña"      value={newPass}      onChange={setNewPass}      placeholder="Mín. 6 caracteres" />
            <PasswordField label="Confirmar contraseña"  value={confirmPass}  onChange={setConfirmPass}  placeholder="Repetí la nueva contraseña" />

            {passError && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(229,62,62,0.08)", boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff" }}
              >
                <AlertCircle size={13} color="#e53e3e" strokeWidth={2} />
                <span style={{ fontSize: "12px", color: "#e53e3e", fontWeight: 500 }}>{passError}</span>
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button
                onClick={handleCancelPassword}
                style={{
                  flex: 1, background: "#e8ecf0", boxShadow: neuFlat,
                  border: "none", borderRadius: 16, padding: "13px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <X size={15} color="#8a9bb0" strokeWidth={2.2} />
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: neuAccent,
                  border: "none", borderRadius: 16, padding: "13px",
                  cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Check size={15} color="#fff" strokeWidth={2.2} />
                Guardar
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── Options menu (always visible when not in sub-form) ── */}
        {section === "view" && (
          <div className="flex flex-col gap-3">

            {/* Change password option */}
            <button
              onClick={() => setSection("password")}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all active:scale-[0.98]"
              style={{ background: "#e8ecf0", boxShadow: neuFlat, border: "none", cursor: "pointer" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(38,198,218,0.10)" }}
              >
                <Lock size={18} color="#26c6da" strokeWidth={1.8} />
              </div>
              <span style={{ flex: 1, fontSize: "15px", fontWeight: 600, color: "#3d4a5c", textAlign: "left" }}>
                Cambiar contraseña
              </span>
              <ChevronRight size={16} color="#a0aec0" strokeWidth={2} />
            </button>

            {/* Logout option */}
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full transition-all active:scale-[0.98]"
              style={{ background: "#e8ecf0", boxShadow: neuFlat, border: "none", cursor: "pointer" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(229,62,62,0.10)" }}
              >
                <LogOut size={18} color="#e53e3e" strokeWidth={1.8} />
              </div>
              <span style={{ flex: 1, fontSize: "15px", fontWeight: 600, color: "#e53e3e", textAlign: "left" }}>
                Cerrar sesión
              </span>
              <ChevronRight size={16} color="#e5a0a0" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
