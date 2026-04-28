import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  User,
  Mail,
  LogOut,
  ChevronRight,
  Search,
  Archive,
  ArrowLeft,
} from "lucide-react";
import {
  createEventForUser,
  setEventArchived,
  setEventStatus,
  subscribeToMyEvents,
} from "../lib/events";
import { useAuth } from "../providers/AuthProvider";
import type { EventItem } from "../types/domain";

type EventStatus = "realizado" | "pendiente" | "cancelado";

type DisplayStatus = EventStatus | "en_curso";

export interface AppEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  status: EventStatus;
  guests: number;
  archived?: boolean;
  location?: string;
  description?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  en_curso: { label: "En curso", color: "#7c3aed", bg: "rgba(124,58,237,0.12)", dot: "#7c3aed" },
  realizado: { label: "Realizado", color: "#00897b", bg: "rgba(0,137,123,0.10)", dot: "#00897b" },
  pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", dot: "#f59e0b" },
  cancelado: { label: "Cancelado", color: "#e53e3e", bg: "rgba(229,62,62,0.10)", dot: "#e53e3e" },
};

function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getDisplayStatus(event: AppEvent): DisplayStatus {
  const today = getLocalDateKey();

  if (event.status === "cancelado") return "cancelado";
  if (event.date < today) return "realizado";

  if (event.date === today) {
    const startMinutes = parseTimeToMinutes(event.time);
    if (nowMinutes() >= startMinutes && event.status !== "realizado") {
      return "en_curso";
    }
  }

  return event.status;
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function EventCard({
  event,
  onClick,
  onArchive,
}: {
  event: AppEvent;
  onClick: () => void;
  onArchive: () => void;
}) {
  const displayStatus: DisplayStatus = getDisplayStatus(event);
  const isActive = displayStatus === "en_curso";
  const canArchive = displayStatus === "realizado";
  const statusCfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.pendiente;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden text-left transition-all duration-150 active:scale-[0.98]"
      style={
        isActive
          ? {
              background: "linear-gradient(145deg, #f0ecff 0%, #e8ecf0 60%)",
              boxShadow: "6px 6px 16px #b0acd4, -6px -6px 16px #ffffff, 0 0 0 1.5px rgba(124,58,237,0.18)",
              border: "none",
              cursor: "pointer",
            }
          : {
              background: "#e8ecf0",
              boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff",
              border: "none",
              cursor: "pointer",
            }
      }
    >
      {isActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
          style={{ background: "linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%)" }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={
              isActive
                ? { background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", boxShadow: "4px 4px 8px #b0acd4, -4px -4px 8px #ffffff" }
                : { background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff" }
            }
          >
            <Calendar size={18} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={1.8} />
          </div>

          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: isActive ? "#4c1d95" : "#3d4a5c", lineHeight: 1.3, margin: 0 }}>
              {event.name}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full" style={{ background: statusCfg.bg }}>
              {isActive ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#7c3aed" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#7c3aed" }} />
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot, display: "inline-block" }} />
              )}
              <span style={{ fontSize: "11px", color: statusCfg.color, fontWeight: 700 }}>{statusCfg.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canArchive && (
            <button
              type="button"
              title="Archivar evento"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              style={{
                border: "none",
                background: "rgba(0,137,123,0.12)",
                color: "#00897b",
                borderRadius: 10,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Archive size={14} />
            </button>
          )}
          {isActive && (
            <div className="px-2.5 py-1 rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>
              HOY
            </div>
          )}
          <ChevronRight size={16} color={isActive ? "#7c3aed" : "#b8bec7"} strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}>
          <Calendar size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}>
          <Clock size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>{event.time}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}>
          <Users size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>{event.guests} invitados</span>
        </div>
      </div>
    </button>
  );
}

function EventCardSkeleton() {
  return (
    <div
      className="w-full rounded-3xl p-5 flex flex-col gap-3"
      style={{
        background: "#e8ecf0",
        boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff",
      }}
    >
      <div className="h-4 rounded-xl" style={{ width: "68%", background: "#d8dfe8" }} />
      <div className="h-3 rounded-xl" style={{ width: "38%", background: "#d8dfe8" }} />
      <div className="flex gap-2 mt-1">
        <div className="h-7 rounded-xl" style={{ width: 90, background: "#d8dfe8" }} />
        <div className="h-7 rounded-xl" style={{ width: 90, background: "#d8dfe8" }} />
        <div className="h-7 rounded-xl" style={{ width: 110, background: "#d8dfe8" }} />
      </div>
    </div>
  );
}

function AccountView({
  name,
  email,
  photoURL,
  onBack,
  onLogout,
}: {
  name: string;
  email: string;
  photoURL?: string | null;
  onBack: () => void;
  onLogout: () => Promise<void>;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          border: "none",
          background: "#e8ecf0",
          boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
          color: "#6b7a8d",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <ArrowLeft size={14} /> Volver a eventos
      </button>

      <div
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
      >
        <div
          className="relative flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ width: 84, height: 84, borderRadius: 28, background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
        >
          {photoURL ? (
            <img src={photoURL} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ width: 68, height: 68, borderRadius: 22, background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)" }}
            >
              <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{initials}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span style={{ fontSize: 18, fontWeight: 800, color: "#3d4a5c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <span style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
        </div>
      </div>

      <div
        className="rounded-3xl p-5 flex flex-col gap-3"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
        >
          <User size={16} color="#26c6da" />
          <span style={{ fontSize: 14, color: "#3d4a5c", fontWeight: 600 }}>{name}</span>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
        >
          <Mail size={16} color="#26c6da" />
          <span style={{ fontSize: 14, color: "#3d4a5c", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full"
        style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff", border: "none", cursor: "pointer" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(229,62,62,0.10)" }}>
          <LogOut size={18} color="#e53e3e" />
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#e53e3e", textAlign: "left" }}>Cerrar sesión</span>
      </button>
    </div>
  );
}

function NewEventModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: { name: string; date: string; time: string; location: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fieldStyle = (field: string) => ({
    background: "#e8ecf0",
    boxShadow:
      focusedField === field
        ? "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff"
        : "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
    border: "none",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#3d4a5c",
    width: "100%",
    outline: "none",
  });

  async function handleSubmit() {
    if (!name.trim() || !date || !time) {
      setError("Nombre, fecha y hora son obligatorios.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onCreate({ name, date, time, location, description });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(60,80,100,0.18)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5" style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} /></div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#3d4a5c", margin: 0 }}>Nuevo evento</h2>
        {error && <div className="rounded-xl px-3 py-2" style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 12 }}>{error}</div>}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Nombre del evento</label>
          <input type="text" placeholder="Ej. Cumpleaños de María" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} style={fieldStyle("name")} />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} onFocus={() => setFocusedField("date")} onBlur={() => setFocusedField(null)} style={fieldStyle("date")} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Hora</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} onFocus={() => setFocusedField("time")} onBlur={() => setFocusedField(null)} style={fieldStyle("time")} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Ubicación</label>
          <input type="text" placeholder="Lugar del evento" value={location} onChange={(e) => setLocation(e.target.value)} onFocus={() => setFocusedField("location")} onBlur={() => setFocusedField(null)} style={fieldStyle("location")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Descripción</label>
          <textarea placeholder="Descripción del evento" value={description} onChange={(e) => setDescription(e.target.value)} onFocus={() => setFocusedField("description")} onBlur={() => setFocusedField(null)} rows={3} style={{ ...fieldStyle("description"), resize: "none" }} />
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl" style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, color: "#8a9bb0" }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)", boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
            {saving ? "Creando..." : "Crear evento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapEvent(item: EventItem): AppEvent {
  return {
    id: item.id,
    name: item.name,
    date: item.date,
    time: item.time,
    status: item.status,
    archived: Boolean(item.archived),
    guests: Number(item.currentGuestCount ?? item.guestCount ?? 0),
    location: item.location || "",
    description: item.description || "",
  };
}

function isPastEvent(event: AppEvent) {
  return event.date < getLocalDateKey();
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    if (!user) {
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    const unsub = subscribeToMyEvents(
      user.uid,
      async (items) => {
        const mapped = items.map(mapEvent);

        const nowProcessed = await Promise.all(
          mapped.map(async (event) => {
            if (isPastEvent(event) && event.status !== "realizado" && event.status !== "cancelado") {
              try {
                await setEventStatus(event.id, "realizado");
                return { ...event, status: "realizado" as EventStatus };
              } catch {
                return event;
              }
            }
            return event;
          }),
        );

        setEvents(nowProcessed);
        setError(null);
        setEventsLoading(false);
      },
      () => {
        setError("No se pudieron cargar los eventos.");
        setEventsLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const welcomeName = useMemo(() => user?.displayName || "Bienvenido de nuevo", [user]);

  const activeEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = events.filter((e) => !e.archived).filter((e) => (query ? e.name.toLowerCase().includes(query) : true));

    return filtered.sort((a, b) => {
      const aStatus = getDisplayStatus(a);
      const bStatus = getDisplayStatus(b);
      if (aStatus === "en_curso" && bStatus !== "en_curso") return -1;
      if (bStatus === "en_curso" && aStatus !== "en_curso") return 1;
      return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    });
  }, [events, search]);

  const archivedEvents = useMemo(
    () => events.filter((e) => e.archived).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [events],
  );

  async function handleCreateEvent(payload: { name: string; date: string; time: string; location: string; description: string }) {
    if (!user?.email) throw new Error("Sesión inválida");
    await createEventForUser(user.uid, user.email, user.displayName ?? user.email.split("@")[0], payload);
  }

  async function handleArchiveEvent(eventId: string) {
    await setEventArchived(eventId, true);
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "#e8ecf0" }}>
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>{welcomeName}</p>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
                {showAccount ? "Mi cuenta" : showArchived ? "Eventos archivados" : "Mis Eventos"}
              </h1>
            </div>
            <button
              onClick={() => setShowAccount(true)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none", cursor: "pointer" }}
              title="Mi cuenta"
            >
              <User size={18} color="#26c6da" strokeWidth={2} />
            </button>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8a9bb0", fontWeight: 600 }}>Versión 0.6.0</p>
        </div>

        <div className="flex-1 px-6 pb-32 flex flex-col gap-4 mt-2">
          {error && <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>}

          {showAccount ? (
            <AccountView
              name={user?.displayName || user?.email?.split("@")[0] || "Usuario"}
              email={user?.email || "Sin correo"}
              photoURL={user?.photoURL}
              onBack={() => setShowAccount(false)}
              onLogout={async () => {
                await logout();
                navigate("/");
              }}
            />
          ) : showArchived ? (
            <>
              <button
                onClick={() => setShowArchived(false)}
                className="self-start flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ border: "none", background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff", color: "#6b7a8d", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                <ArrowLeft size={14} /> Volver a eventos
              </button>

              {archivedEvents.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#a0aec0", margin: 0 }}>No hay eventos archivados.</p>
              ) : (
                archivedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff" }}
                  >
                    <span style={{ fontSize: 14, color: "#3d4a5c", fontWeight: 600 }}>{event.name}</span>
                    <span style={{ fontSize: 12, color: "#8a9bb0", fontWeight: 600 }}>{formatDate(event.date)}</span>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                style={{ background: "#e8ecf0", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
              >
                <Search size={14} color="#8a9bb0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar eventos..."
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#3d4a5c" }}
                />
              </div>

              {eventsLoading ? (
                <>
                  <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 600, margin: 0 }}>Cargando eventos...</p>
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                </>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>{activeEvents.length} eventos visibles</p>
                  {activeEvents.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#a0aec0", margin: 0 }}>No hay eventos para mostrar.</p>
                  ) : (
                    activeEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => navigate(`/event/${event.id}`)}
                        onArchive={() => handleArchiveEvent(event.id)}
                      />
                    ))
                  )}

                  <button
                    onClick={() => setShowArchived(true)}
                    className="mt-1 self-center"
                    style={{ border: "none", background: "transparent", color: "#00acc1", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Ver eventos archivados ({archivedEvents.length})
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {!showArchived && !showAccount && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-6 pointer-events-none">
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 pointer-events-auto transition-all duration-150 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                boxShadow: "6px 6px 16px rgba(0,172,193,0.45), -2px -2px 8px rgba(255,255,255,0.6)",
                border: "none",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              <Plus size={20} color="#fff" strokeWidth={2.5} />
              Agregar evento
            </button>
          </div>
        )}
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onCreate={handleCreateEvent} />}
    </div>
  );
}
