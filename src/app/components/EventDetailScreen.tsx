import { QRScannerTab } from "./QRScannerTab";
import { SorteoTab } from "./SorteoTab";
import { CuentaTab } from "./CuentaTab";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Edit3,
  Check,
  X,
  UserPlus,
  Upload,
  Download,
  Zap,
  Gift,
  User,
  ScanLine,
  Search,
  Hash,
  AlertCircle,
  Phone,
  Mail,
  Ban,
  MapPin,
  Lock,
  Send,
  Trash2,
} from "lucide-react";
import { BulkUploadModal, type ParsedGuest } from "./BulkUploadModal";
import { SendInvitationsModal, type GuestToInvite } from "./SendInvitationsModal";
import {
  addGuestToEvent,
  deleteGuestFromEvent,
  getEventById,
  markGuestPresent,
  setGuestInvitationStatus,
  subscribeToGuests,
} from "../lib/events";
import type { EventItem, GuestItem } from "../types/domain";
import { buildInviteHtml, sendInvitationEmail } from "../lib/email";

const TODAY = new Date().toISOString().split("T")[0];

// ── Types ─────────────────────────────────────────────────────────────────────
type EventStatus = "realizado" | "pendiente" | "cancelado" | "en_curso";

interface AppEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  status: EventStatus;
  guests: number;
  location?: string;
  description?: string;
}

interface Guest {
  docId?: string;
  id: number;
  name: string;
  email?: string;
  phone?: string;
  present: boolean;
  extra: boolean;
  bracelet?: number;
  qrDataUrl?: string;
  inviteStatus?: "pending" | "sent" | "failed";
  inviteSentAt?: string;
  inviteLastAttemptAt?: string;
  inviteError?: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  en_curso:  { label: "En curso",  color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  realizado: { label: "Realizado", color: "#00897b", bg: "rgba(0,137,123,0.10)"  },
  pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  cancelado: { label: "Cancelado", color: "#e53e3e", bg: "rgba(229,62,62,0.10)"  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function inviteStatusVisual(status?: "pending" | "sent" | "failed") {
  if (status === "sent") {
    return { label: "Invitación enviada", color: "#00897b", bg: "rgba(0,137,123,0.12)" };
  }
  if (status === "failed") {
    return { label: "Falló el envío", color: "#e53e3e", bg: "rgba(229,62,62,0.12)" };
  }
  return { label: "Sin envío", color: "#8a9bb0", bg: "rgba(160,174,192,0.12)" };
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
type NavTab = "eventos" | "invitados" | "escanear" | "sorteo" | "cuenta";

function BottomNav({ active, onChange }: { active: NavTab; onChange: (t: NavTab) => void }) {
  const tabs: { id: NavTab; label: string; Icon: React.ElementType }[] = [
    { id: "eventos",   label: "Eventos",   Icon: Calendar },
    { id: "invitados", label: "Invitados", Icon: Users    },
    { id: "escanear",  label: "Escanear",  Icon: ScanLine },
    { id: "sorteo",    label: "Sorteo",    Icon: Gift     },
    { id: "cuenta",    label: "Cuenta",    Icon: User     },
  ];

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 pb-6 pt-2 z-40"
      style={{ background: "linear-gradient(to top, #e8ecf0 70%, transparent)" }}
    >
      <div
        className="w-full flex items-center justify-around rounded-3xl px-2 py-2"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 16px #b8bec7, -6px -6px 16px #ffffff" }}
      >
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const isScan   = id === "escanear";

          if (isScan) {
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="flex flex-col items-center justify-center -mt-5"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                    boxShadow: isActive
                      ? "inset 3px 3px 6px rgba(0,120,140,0.4), inset -2px -2px 4px rgba(255,255,255,0.15)"
                      : "5px 5px 12px rgba(0,172,193,0.4), -3px -3px 8px rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon size={22} color="#fff" strokeWidth={2} />
                </div>
                <span style={{ fontSize: "10px", color: "#26c6da", fontWeight: 600, marginTop: "4px" }}>
                  {label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-1"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Icon size={20} color={isActive ? "#26c6da" : "#a0aec0"} strokeWidth={isActive ? 2.2 : 1.8} />
              <span style={{ fontSize: "10px", color: isActive ? "#26c6da" : "#a0aec0", fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, Icon }: { label: string; value: number; color: string; Icon: React.ElementType }) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} color={color} strokeWidth={2} />
      </div>
      <span style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "11px", color: "#8a9bb0", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Field Input ───────────────────────────────────────────────────────────────
function FieldInput({
  label, value, editing, onChange, type = "text", Icon,
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void;
  type?: string; Icon: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPickerType = type === "date" || type === "time";

  const handleIconClick = () => {
    if (editing && isPickerType) {
      try { inputRef.current?.showPicker(); } catch (_) { inputRef.current?.focus(); }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>{label}</label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
        style={{
          background: "#e8ecf0",
          boxShadow: editing
            ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
            : "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
        }}
      >
        <button
          type="button"
          onClick={handleIconClick}
          style={{
            background: "none", border: "none", padding: 0, display: "flex", flexShrink: 0,
            cursor: editing && isPickerType ? "pointer" : "default",
          }}
        >
          <Icon size={16} color={editing ? "#26c6da" : "#a0aec0"} strokeWidth={1.8} />
        </button>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={!editing}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: "14px", color: "#3d4a5c",
            ...(isPickerType ? {
              WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
              appearance: "none" as React.CSSProperties["appearance"],
              colorScheme: "light" as React.CSSProperties["colorScheme"],
            } : {}),
          }}
        />
      </div>
    </div>
  );
}

// ── Action Button ─────────────────────────────────────────────────────────────
function ActionButton({ label, Icon, accent = false, onClick }: { label: string; Icon: React.ElementType; accent?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-150 active:scale-[0.97]"
      style={{
        background: accent ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)" : "#e8ecf0",
        boxShadow: accent
          ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
          : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
        border: "none", cursor: "pointer",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = accent ? "inset 3px 3px 6px rgba(0,120,140,0.35), inset -2px -2px 4px rgba(255,255,255,0.15)" : "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff"; }}
      onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.boxShadow = accent ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)" : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff"; }}
      onMouseLeave={(e)=> { (e.currentTarget as HTMLButtonElement).style.boxShadow = accent ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)" : "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff"; }}
    >
      <Icon size={20} color={accent ? "#fff" : "#26c6da"} strokeWidth={1.8} />
      <span style={{ fontSize: "11px", color: accent ? "#fff" : "#3d4a5c", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  );
}

// ── Guest Detail Sheet ────────────────────────────────────────────────────────
function GuestDetailSheet({
  guest,
  onClose,
  onConfirmPresence,
  onResendInvitation,
  onDeleteGuest,
}: {
  guest: Guest;
  onClose: () => void;
  onConfirmPresence: (bracelet: number) => void;
  onResendInvitation: () => Promise<void>;
  onDeleteGuest: () => Promise<void>;
}) {
  const [bracelet, setBracelet] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  const canMark = bracelet.trim() !== "" && Number(bracelet) > 0;
  const inviteBadge = inviteStatusVisual(guest.inviteStatus);

  const handleMarkPresent = () => {
    if (!canMark) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onConfirmPresence(Number(bracelet));
    setShowConfirm(false);
    onClose();
  };

  const handleResend = async () => {
    setInviteFeedback(null);
    try {
      setSendingInvite(true);
      await onResendInvitation();
      setInviteFeedback("Invitación enviada correctamente.");
    } catch (e: any) {
      setInviteFeedback(e?.message ?? "No se pudo reenviar la invitación.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDeleteGuest();
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(60,80,100,0.22)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      >
        {/* Sheet */}
        <div
          className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
          style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center -mb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
          </div>

          {/* Guest header */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#e8ecf0",
                boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff",
              }}
            >
              <User size={24} color={guest.present ? "#00897b" : "#8a9bb0"} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c" }}>
                  {guest.name}
                </span>
                {guest.extra && (
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "10px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", fontWeight: 600 }}>
                    Extra
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span style={{ fontSize: "12px", color: "#8a9bb0" }}>ID:</span>
                <span style={{ fontSize: "12px", color: "#3d4a5c", fontWeight: 600 }}>#{String(guest.id).padStart(4, "0")}</span>
              </div>
            </div>
            {/* Status badge */}
            <div
              className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              style={{
                background: guest.present ? "rgba(0,137,123,0.12)" : "rgba(229,62,62,0.08)",
                boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff",
              }}
            >
              {guest.present
                ? <Check size={13} color="#00897b" strokeWidth={2.5} />
                : <X size={13} color="#e53e3e" strokeWidth={2.5} />}
              <span style={{ fontSize: "12px", color: guest.present ? "#00897b" : "#e53e3e", fontWeight: 600 }}>
                {guest.present ? "Presente" : "Ausente"}
              </span>
            </div>
          </div>

          {/* Already present — read-only info */}
          {guest.present ? (
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,137,123,0.12)" }}>
                <Hash size={16} color="#00897b" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0, fontWeight: 500 }}>Pulsera asignada</p>
                <p style={{ fontSize: "18px", color: "#00897b", margin: 0, fontWeight: 700 }}>
                  {guest.bracelet ?? "—"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,137,123,0.10)" }}>
                <Check size={13} color="#00897b" strokeWidth={2.5} />
                <span style={{ fontSize: "12px", color: "#00897b", fontWeight: 600 }}>Confirmado</span>
              </div>
            </div>
          ) : (
            <>
              {/* Bracelet input */}
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
                  Número de pulsera
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
                >
                  <Hash size={16} color="#26c6da" strokeWidth={2} />
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 105"
                    value={bracelet}
                    onChange={(e) => setBracelet(e.target.value)}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      fontSize: "20px", color: "#3d4a5c", fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              {/* Mark present button */}
              <button
                onClick={handleMarkPresent}
                disabled={!canMark}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
                style={{
                  background: canMark
                    ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)"
                    : "#e8ecf0",
                  boxShadow: canMark
                    ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
                    : "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
                  border: "none",
                  cursor: canMark ? "pointer" : "default",
                }}
              >
                <Check size={18} color={canMark ? "#fff" : "#a0aec0"} strokeWidth={2.2} />
                <span style={{ fontSize: "15px", fontWeight: 600, color: canMark ? "#fff" : "#a0aec0" }}>
                  Marcar como presente
                </span>
              </button>
            </>
          )}

          {/* Invitation status */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 600 }}>
                Estado de invitación
              </span>
              <span className="px-2 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 700, color: inviteBadge.color, background: inviteBadge.bg }}>
                {inviteBadge.label}
              </span>
            </div>
            {guest.inviteSentAt && (
              <span style={{ fontSize: "11px", color: "#6b7a8d" }}>
                Último envío: {new Date(guest.inviteSentAt).toLocaleString("es-CL")}
              </span>
            )}
            {guest.inviteError && (
              <span style={{ fontSize: "11px", color: "#e53e3e" }}>{guest.inviteError}</span>
            )}
            {inviteFeedback && (
              <span style={{ fontSize: "11px", color: inviteFeedback.includes("correctamente") ? "#00897b" : "#e53e3e" }}>
                {inviteFeedback}
              </span>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleResend}
                disabled={sendingInvite || !guest.email}
                className="flex-1 py-2.5 rounded-xl"
                style={{
                  border: "none",
                  background: guest.email ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "#d8dfe8",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: guest.email ? "pointer" : "not-allowed",
                }}
              >
                {sendingInvite ? "Enviando..." : "Reenviar invitación"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-11 h-10 rounded-xl flex items-center justify-center"
                style={{ border: "none", background: "rgba(229,62,62,0.12)", cursor: "pointer" }}
                title="Eliminar invitado"
              >
                <Trash2 size={16} color="#e53e3e" />
              </button>
            </div>
            {!guest.email && (
              <span style={{ fontSize: "10px", color: "#a0aec0" }}>
                Este invitado no tiene correo cargado.
              </span>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl"
            style={{
              background: "#e8ecf0",
              boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
              border: "none", cursor: "pointer",
              fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-8"
          style={{ background: "rgba(60,80,100,0.3)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-[320px] rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "#e8ecf0", boxShadow: "10px 10px 24px #b8bec7, -10px -10px 24px #ffffff" }}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#e8ecf0", boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff" }}
              >
                <AlertCircle size={26} color="#26c6da" strokeWidth={1.8} />
              </div>
            </div>

            <div className="text-center flex flex-col gap-2">
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
                Confirmar presencia
              </h3>
              <p style={{ fontSize: "14px", color: "#8a9bb0", margin: 0, lineHeight: 1.5 }}>
                ¿Deseas marcar a{" "}
                <span style={{ color: "#3d4a5c", fontWeight: 600 }}>{guest.name}</span>{" "}
                como <span style={{ color: "#00897b", fontWeight: 600 }}>presente</span> con la pulsera{" "}
                <span style={{ color: "#26c6da", fontWeight: 700 }}>#{bracelet}</span>?
              </p>
              <p style={{ fontSize: "12px", color: "#e53e3e", margin: 0 }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl"
                style={{
                  background: "#e8ecf0",
                  boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
                  border: "none", cursor: "pointer",
                  fontSize: "14px", fontWeight: 600, color: "#8a9bb0",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                  border: "none", cursor: "pointer",
                  fontSize: "14px", fontWeight: 600, color: "#fff",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-8"
          style={{ background: "rgba(60,80,100,0.3)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-[320px] rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "#e8ecf0", boxShadow: "10px 10px 24px #b8bec7, -10px -10px 24px #ffffff" }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0, textAlign: "center" }}>
              Eliminar invitado
            </h3>
            <p style={{ fontSize: "13px", color: "#8a9bb0", margin: 0, textAlign: "center" }}>
              ¿Seguro que quieres eliminar a <strong style={{ color: "#3d4a5c" }}>{guest.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl"
                style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff", border: "none", fontWeight: 600, color: "#8a9bb0" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl"
                style={{ background: "#e53e3e", boxShadow: "5px 5px 12px rgba(229,62,62,0.35)", border: "none", fontWeight: 700, color: "#fff" }}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Guest Row ─────────────────────────────────────────────────────────────────
function GuestRow({ guest, onClick }: { guest: Guest; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 active:scale-[0.98] text-left"
      style={{
        background: "#e8ecf0",
        boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
        border: "none", cursor: "pointer",
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: guest.present ? "rgba(0,137,123,0.12)" : "rgba(160,174,192,0.10)" }}
      >
        <User size={15} color={guest.present ? "#00897b" : "#a0aec0"} strokeWidth={2} />
      </div>

      {/* ID + Name */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: "10px", color: "#a0aec0", fontWeight: 500 }}>
            #{String(guest.id).padStart(4, "0")}
          </span>
          {guest.extra && (
            <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: "9px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", fontWeight: 700 }}>
              EXTRA
            </span>
          )}
        </div>
        <span style={{ fontSize: "14px", color: "#3d4a5c", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {guest.name}
        </span>
      </div>

      {/* Present status icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: guest.present ? "rgba(0,137,123,0.12)" : "rgba(229,62,62,0.08)",
          boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff",
        }}
      >
        {guest.present
          ? <Check size={13} color="#00897b" strokeWidth={2.5} />
          : <X size={13} color="#e53e3e" strokeWidth={2.5} />}
      </div>
    </button>
  );
}

// ── Add Guest Modal ───────────────────────────────────────────────────────────
function AddGuestModal({
  isEnCurso,
  isPendiente,
  onClose,
  onSave,
}: {
  isEnCurso: boolean;
  isPendiente: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string, email: string) => void;
}) {
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [email, setEmail]           = useState("");
  const [nameFocus, setNameFocus]   = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const requireEmail = isPendiente && !isEnCurso;

  const canSave = requireEmail
    ? name.trim().length > 0 && email.trim().length > 0 && email.includes("@")
    : name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(name.trim(), phone.trim(), email.trim());
    onClose();
  };

  const inputBox = (focused: boolean) => ({
    background: "#e8ecf0",
    boxShadow: focused
      ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
      : "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.22)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center -mb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
        </div>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff" }}
          >
            <UserPlus size={18} color="#26c6da" strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
              Agregar invitado
            </h2>
            {isEnCurso && (
              <p style={{ fontSize: "11px", color: "#f59e0b", margin: 0, fontWeight: 600 }}>
                Se registrará como invitado EXTRA
              </p>
            )}
          </div>
        </div>

        {/* EMAIL — first & prominent for pendiente (not for en_curso) */}
        {requireEmail && (
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: "13px", color: "#26c6da", fontWeight: 700 }}>
              Correo electrónico <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
              style={{
                background: "#e8ecf0",
                boxShadow: emailFocus
                  ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                  : "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff",
                outline: emailFocus ? "2px solid rgba(38,198,218,0.25)" : "2px solid transparent",
              }}
            >
              <Mail size={18} color="#26c6da" strokeWidth={2} />
              <input
                type="email"
                placeholder="invitado@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: "15px", color: "#3d4a5c",
                }}
              />
              {email.includes("@") && (
                <Check size={14} color="#00897b" strokeWidth={2.5} />
              )}
            </div>
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
            Nombre completo <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={inputBox(nameFocus)}
          >
            <User size={15} color={nameFocus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
            <input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              autoFocus={!requireEmail}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "15px", color: "#3d4a5c",
              }}
            />
          </div>
        </div>

        {/* Phone (optional) */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
            Teléfono <span style={{ color: "#a0aec0" }}>(opcional)</span>
          </label>
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={inputBox(phoneFocus)}
          >
            <Phone size={15} color={phoneFocus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
            <input
              type="tel"
              placeholder="Ej. +54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setPhoneFocus(true)}
              onBlur={() => setPhoneFocus(false)}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "15px", color: "#3d4a5c",
              }}
            />
          </div>
        </div>

        {/* Extra badge info */}
        {isEnCurso && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(245,158,11,0.08)", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
          >
            <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
            <p style={{ fontSize: "12px", color: "#b45309", margin: 0, lineHeight: 1.5 }}>
              Al ser un evento en curso, este invitado quedará marcado como <strong>Extra</strong> en el listado.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl"
            style={{
              background: "#e8ecf0",
              boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
              border: "none", cursor: "pointer",
              fontSize: "15px", fontWeight: 600, color: "#8a9bb0",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-4 rounded-2xl transition-all duration-150 active:scale-[0.97]"
            style={{
              background: canSave
                ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)"
                : "#e8ecf0",
              boxShadow: canSave
                ? "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"
                : "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
              border: "none", cursor: canSave ? "pointer" : "default",
              fontSize: "15px", fontWeight: 600,
              color: canSave ? "#fff" : "#a0aec0",
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invitados Tab ─────────────────────────────────────────────────────────────
function InvitadosTab({
  guests,
  onUpdateGuest,
  onResendInvitation,
  onDeleteGuest,
  onAddGuest,
  canAdd,
  hasBulkLoaded,
  onSendInvitations,
}: {
  guests: Guest[];
  onUpdateGuest: (id: number, bracelet: number) => void;
  onResendInvitation: (guestId: number) => Promise<void>;
  onDeleteGuest: (guestId: number) => Promise<void>;
  onAddGuest: () => void;
  canAdd: boolean;
  hasBulkLoaded: boolean;
  onSendInvitations: () => void;
}) {
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<Guest | null>(null);
  const [searchFocus, setSearchFocus] = useState(false);

  const filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    String(g.id).includes(search)
  );

  const handleConfirmPresence = (bracelet: number) => {
    if (selected) {
      onUpdateGuest(selected.id, bracelet);
      setSelected(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Search + Add row */}
        <div className="flex gap-3 items-center">
          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl flex-1"
            style={{
              background: "#e8ecf0",
              boxShadow: searchFocus
                ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
                : "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
            }}
          >
            <Search size={15} color={searchFocus ? "#26c6da" : "#a0aec0"} strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar invitado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "14px", color: "#3d4a5c",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={14} color="#a0aec0" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Add guest button — only if allowed */}
          {canAdd && (
            <button
              onClick={onAddGuest}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-[0.95]"
              style={{
                background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                border: "none", cursor: "pointer",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "inset 3px 3px 6px rgba(0,120,140,0.4), inset -2px -2px 4px rgba(255,255,255,0.15)"; }}
              onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"; }}
              onMouseLeave={(e)=> { (e.currentTarget as HTMLButtonElement).style.boxShadow = "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)"; }}
            >
              <UserPlus size={18} color="#fff" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Enviar invitaciones — shown only after bulk upload */}
        {hasBulkLoaded && (
          <button
            onClick={onSendInvitations}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl transition-all duration-150 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow: "5px 5px 12px rgba(124,58,237,0.35), -2px -2px 8px rgba(255,255,255,0.5)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Send size={15} color="#fff" strokeWidth={2} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
              Enviar invitaciones ({guests.length})
            </span>
          </button>
        )}

        {/* Count */}
        <p style={{ fontSize: "12px", color: "#a0aec0", fontWeight: 500, margin: 0 }}>
          {filtered.length} de {guests.length} invitados
        </p>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <Search size={28} color="#c8d0da" strokeWidth={1.5} />
            <p style={{ fontSize: "14px", color: "#a0aec0" }}>Sin resultados</p>
          </div>
        ) : (
          filtered.map((g) => (
            <GuestRow key={g.id} guest={g} onClick={() => setSelected(g)} />
          ))
        )}
      </div>

      {selected && (
        <GuestDetailSheet
          guest={selected}
          onClose={() => setSelected(null)}
          onConfirmPresence={handleConfirmPresence}
          onResendInvitation={() => onResendInvitation(selected.id)}
          onDeleteGuest={() => onDeleteGuest(selected.id)}
        />
      )}
    </>
  );
}

// ── Evento Tab ────────────────────────────────────────────────────────────────
function EventoTab({
  event,
  guests,
  onAddGuest,
  canAdd,
  isPendiente,
  onBulkUpload,
}: {
  event: AppEvent;
  guests: Guest[];
  onAddGuest: () => void;
  canAdd: boolean;
  isPendiente: boolean;
  onBulkUpload: () => void;
}) {
  const isRealizado = event.status === "realizado";
  const isCancelado = event.status === "cancelado";

  const [editing, setEditing]         = useState(false);
  const [name, setName]               = useState(event.name);
  const [date, setDate]               = useState(event.date);
  const [time, setTime]               = useState(event.time);
  const [location, setLocation]       = useState(event.location ?? "Centro de Eventos Central");
  const [description, setDescription] = useState(event.description ?? "Evento especial agendado.");
  const [localStatus, setLocalStatus] = useState<EventStatus>(event.status);

  const handleDateChange = (v: string) => {
    setDate(v);
    if (isCancelado && v) setLocalStatus("pendiente");
  };
  const handleTimeChange = (v: string) => {
    setTime(v);
    if (isCancelado && v) setLocalStatus("pendiente");
  };

  const statusCfg = STATUS_LABELS[localStatus] ?? STATUS_LABELS["pendiente"];
  const present   = guests.filter((g) => g.present).length;
  const extras    = guests.filter((g) => g.extra).length;

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="flex gap-3">
        <KpiCard label="Invitados" value={guests.length} color="#26c6da" Icon={Users}    />
        <KpiCard label="Presentes" value={present}       color="#00897b" Icon={Check}    />
        <KpiCard label="Extras"    value={extras}        color="#f59e0b" Icon={UserPlus} />
      </div>

      {/* Event info */}
      <div
        className="rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
      >
        <div className="flex items-center justify-between">
          <div className="px-3 py-1 rounded-full" style={{ background: statusCfg.bg }}>
            <span style={{ fontSize: "12px", color: statusCfg.color, fontWeight: 600 }}>{statusCfg.label}</span>
          </div>

          {/* Edit button — hidden for realizado */}
          {isRealizado ? (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "#e8ecf0",
                boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
              }}
            >
              <Lock size={15} color="#c8d0da" strokeWidth={2} />
            </div>
          ) : (
            <button
              onClick={() => setEditing(!editing)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "#e8ecf0",
                boxShadow: editing ? "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" : "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
                border: "none", cursor: "pointer",
              }}
            >
              {editing
                ? <Check size={16} color="#26c6da" strokeWidth={2.2} />
                : <Edit3 size={16} color="#8a9bb0" strokeWidth={1.8} />}
            </button>
          )}
        </div>

        {/* Read-only notice for realizado */}
        {isRealizado && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,137,123,0.07)", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}
          >
            <Lock size={12} color="#00897b" strokeWidth={2} />
            <span style={{ fontSize: "11px", color: "#00897b", fontWeight: 500 }}>
              Los datos de un evento realizado no pueden modificarse.
            </span>
          </div>
        )}

        {/* Pending-transition notice for cancelado */}
        {isCancelado && localStatus === "pendiente" && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(245,158,11,0.08)", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}
          >
            <AlertCircle size={12} color="#f59e0b" strokeWidth={2} />
            <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 500 }}>
              Al guardar, el evento pasará a estado <strong>Pendiente</strong>.
            </span>
          </div>
        )}

        <FieldInput label="Nombre del evento" value={name}        editing={editing && !isRealizado} onChange={setName}        Icon={Zap}     />
        <div className="flex gap-3">
          <div className="flex-1">
            <FieldInput label="Fecha" value={date} editing={editing && !isRealizado} onChange={handleDateChange} type="date" Icon={Calendar} />
          </div>
          <div className="flex-1">
            <FieldInput label="Hora"  value={time} editing={editing && !isRealizado} onChange={handleTimeChange} type="time" Icon={Clock}    />
          </div>
        </div>
        <FieldInput label="Ubicación"   value={location}    editing={editing && !isRealizado} onChange={setLocation}    Icon={MapPin}  />
        <FieldInput label="Descripción" value={description} editing={editing && !isRealizado} onChange={setDescription} Icon={Edit3}   />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {canAdd ? (
          <ActionButton label={"Agregar\nInvitado"} Icon={UserPlus} onClick={onAddGuest} />
        ) : (
          <div
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{
              background: "#e8ecf0",
              boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
            }}
          >
            <Ban size={20} color="#c8d0da" strokeWidth={1.8} />
            <span style={{ fontSize: "11px", color: "#c8d0da", fontWeight: 600, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>
              {"Agregar\nInvitado"}
            </span>
          </div>
        )}
        {/* Carga Masiva — functional only for pendiente */}
        {isPendiente ? (
          <ActionButton label={"Carga\nMasiva"} Icon={Upload} onClick={onBulkUpload} />
        ) : (
          <div
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: "#e8ecf0", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
          >
            <Upload size={20} color="#c8d0da" strokeWidth={1.8} />
            <span style={{ fontSize: "11px", color: "#c8d0da", fontWeight: 600, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>
              {"Carga\nMasiva"}
            </span>
          </div>
        )}
        <ActionButton label={"Descargar\nExcel"} Icon={Download} accent />
      </div>

      {!canAdd && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(229,62,62,0.06)", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
        >
          <Ban size={15} color="#e53e3e" strokeWidth={2} />
          <p style={{ fontSize: "12px", color: "#e53e3e", margin: 0, lineHeight: 1.4 }}>
            No se pueden agregar invitados a un evento <strong>realizado</strong> o <strong>cancelado</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Placeholder Tab ───────────────────────────────────────────────────────────
function PlaceholderTab({ label, Icon }: { label: string; Icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff" }}
      >
        <Icon size={28} color="#a0aec0" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: "15px", color: "#8a9bb0", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function EventDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTab>("eventos");
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSendInvitations, setShowSendInvitations] = useState(false);
  const [hasBulkLoaded, setHasBulkLoaded] = useState(false);
  const [guestToInvite, setGuestToInvite] = useState<GuestToInvite | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    getEventById(id)
      .then((data: EventItem | null) => {
        if (!alive) return;
        if (!data) {
          setEvent(null);
          return;
        }
        setEvent({
          id: data.id,
          name: data.name,
          date: data.date,
          time: data.time,
          status: data.status as EventStatus,
          guests: 0,
          location: data.location,
          description: data.description,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToGuests(id, (items: GuestItem[]) => {
      const mapped: Guest[] = items.map((g) => ({
        docId: g.id,
        id: g.guestNumber,
        name: g.name,
        email: g.email || undefined,
        phone: g.phone || undefined,
        present: g.status === "presente",
        extra: g.isExtra,
        bracelet: g.braceletNumber,
        qrDataUrl: g.qrDataUrl,
        inviteStatus: g.inviteStatus ?? "pending",
        inviteSentAt: g.inviteSentAt ?? "",
        inviteLastAttemptAt: g.inviteLastAttemptAt ?? "",
        inviteError: g.inviteError ?? "",
      }));
      setGuests(mapped);
      setEvent((prev) => (prev ? { ...prev, guests: mapped.length } : prev));
    });
    return () => unsub();
  }, [id]);

  const isEnCurso = Boolean(event && event.date === TODAY && event.status !== "cancelado");
  const isPendiente = Boolean(event && event.status === "pendiente");
  const canAdd = Boolean(event && event.status !== "realizado" && event.status !== "cancelado");

  const handleUpdateGuest = async (guestId: number, bracelet: number) => {
    if (!id) return;
    const target = guests.find((g) => g.id === guestId);
    if (!target?.docId) return;
    await markGuestPresent(id, target.docId, bracelet);
  };

  const handleAddGuest = async (name: string, phone: string, email: string) => {
    if (!id) return;
    const trimmedEmail = email.trim();
    await addGuestToEvent(id, {
      name,
      phone,
      email: trimmedEmail || undefined,
      isExtra: isEnCurso,
    });
    if (isPendiente && !isEnCurso && trimmedEmail) {
      const nextId = Math.max(...guests.map((g) => g.id), 0) + 1;
      setGuestToInvite({ id: nextId, name, email: trimmedEmail });
    }
  };

  const sendInvitationForGuest = async (guest: Guest) => {
    if (!id || !guest.docId) return;
    if (!guest.email) {
      throw new Error("Este invitado no tiene correo cargado.");
    }

    await setGuestInvitationStatus(id, guest.docId, { status: "pending" });

    try {
      const baseMessage =
        "Te invitamos al evento. Adjunto encontrarás tu código QR de acceso. Presenta este código en el ingreso.";
      const qrDataUrl =
        guest.qrDataUrl ||
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z/C/HwAF/gK9Kq7m0QAAAABJRU5ErkJggg==";

      const html = buildInviteHtml({
        guestName: guest.name,
        message: baseMessage,
        qrDataUrl,
      });

      await sendInvitationEmail({
        to: guest.email,
        subject: `Tu invitación al evento ${event?.name ?? ""}`.trim(),
        html,
      });

      await setGuestInvitationStatus(id, guest.docId, { status: "sent" });
    } catch (e: any) {
      await setGuestInvitationStatus(id, guest.docId, {
        status: "failed",
        error: e?.message ?? "No se pudo enviar invitación.",
      });
      throw e;
    }
  };

  const handleResendInvitation = async (guestId: number) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) throw new Error("Invitado no encontrado.");
    await sendInvitationForGuest(guest);
  };

  const handleDeleteGuest = async (guestId: number) => {
    if (!id) return;
    const guest = guests.find((g) => g.id === guestId);
    if (!guest?.docId) return;
    await deleteGuestFromEvent(id, guest.docId);
  };

  const handleBulkSuccess = async (parsed: ParsedGuest[]) => {
    if (!id) return;
    for (const p of parsed) {
      // eslint-disable-next-line no-await-in-loop
      await addGuestToEvent(id, {
        name: p.name,
        phone: p.phone || "",
        email: p.email,
        isExtra: false,
      });
    }
    setHasBulkLoaded(true);
    setActiveTab("invitados");
  };

  const inviteGuests: GuestToInvite[] = guestToInvite
    ? [guestToInvite]
    : guests.map((g) => ({ id: g.id, name: g.name, email: g.email }));

  const handleSendClose = () => {
    setShowSendInvitations(false);
    setGuestToInvite(null);
    setHasBulkLoaded(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e8ecf0" }}>
        <p style={{ color: "#8a9bb0" }}>Cargando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e8ecf0" }}>
        <p style={{ color: "#8a9bb0" }}>Evento no encontrado</p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "eventos":
        return (
          <EventoTab
            event={event}
            guests={guests}
            onAddGuest={() => setShowAddGuest(true)}
            canAdd={canAdd}
            isPendiente={isPendiente}
            onBulkUpload={() => setShowBulkModal(true)}
          />
        );
      case "invitados":
        return (
          <InvitadosTab
            guests={guests}
            onUpdateGuest={handleUpdateGuest}
            onResendInvitation={handleResendInvitation}
            onDeleteGuest={handleDeleteGuest}
            onAddGuest={() => setShowAddGuest(true)}
            canAdd={canAdd}
            hasBulkLoaded={hasBulkLoaded}
            onSendInvitations={() => setShowSendInvitations(true)}
          />
        );
      case "escanear":
        return <QRScannerTab guests={guests} onMarkPresent={handleUpdateGuest} />;
      case "sorteo":
        return <SorteoTab guests={guests} />;
      case "cuenta":
        return <CuentaTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "#e8ecf0" }}>
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={18} color="#3d4a5c" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>Detalle del evento</p>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#3d4a5c", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {event.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 px-6 pb-36 overflow-y-auto">
          {renderTab()}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>

      {showAddGuest && (
        <AddGuestModal
          isEnCurso={isEnCurso}
          isPendiente={isPendiente}
          onClose={() => setShowAddGuest(false)}
          onSave={handleAddGuest}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          eventName={event.name}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkSuccess}
        />
      )}

      {(showSendInvitations || guestToInvite !== null) && (
        <SendInvitationsModal
          guests={inviteGuests}
          onGuestResult={async (guestNumber, result) => {
            if (!id) return;
            const target = guests.find((g) => g.id === guestNumber);
            if (!target?.docId) return;
            await setGuestInvitationStatus(id, target.docId, {
              status: result.status,
              error: result.error,
            });
          }}
          onClose={handleSendClose}
        />
      )}
    </div>
  );
}
