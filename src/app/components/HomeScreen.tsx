import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, Users, Plus, User, ChevronRight } from "lucide-react";
import { createEventForUser, subscribeToMyEvents } from "../lib/events";
import { useAuth } from "../providers/AuthProvider";
import type { EventItem } from "../types/domain";

type EventStatus = "realizado" | "pendiente" | "cancelado";

export interface AppEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  status: EventStatus;
  guests: number;
  location?: string;
  description?: string;
}

const TODAY = new Date().toISOString().split("T")[0];
type DisplayStatus = EventStatus | "en_curso";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  en_curso: { label: "En curso", color: "#7c3aed", bg: "rgba(124,58,237,0.12)", dot: "#7c3aed" },
  realizado: { label: "Realizado", color: "#00897b", bg: "rgba(0,137,123,0.10)", dot: "#00897b" },
  pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", dot: "#f59e0b" },
  cancelado: { label: "Cancelado", color: "#e53e3e", bg: "rgba(229,62,62,0.10)", dot: "#e53e3e" },
};

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function getDisplayStatus(event: AppEvent): DisplayStatus {
  if (event.date === TODAY && event.status !== "cancelado") return "en_curso";
  return event.status;
}

function EventCard({ event, onClick }: { event: AppEvent; onClick: () => void }) {
  const displayStatus: DisplayStatus = getDisplayStatus(event);
  const isActive = displayStatus === "en_curso";
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
    guests: Number(item.guestCount ?? 0),
    location: item.location || "",
    description: item.description || "",
  };
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyEvents(
      user.uid,
      (items) => {
        const mapped = items.map(mapEvent);
        mapped.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        setEvents(mapped);
        setError(null);
      },
      () => setError("No se pudieron cargar los eventos."),
    );
    return () => unsub();
  }, [user]);

  const welcomeName = useMemo(() => user?.displayName || "Bienvenido de nuevo", [user]);

  async function handleCreateEvent(payload: { name: string; date: string; time: string; location: string; description: string }) {
    if (!user?.email) throw new Error("Sesión inválida");
    await createEventForUser(user.uid, user.email, user.displayName ?? user.email.split("@")[0], payload);
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "#e8ecf0" }}>
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>{welcomeName}</p>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>Mis Eventos</h1>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none", cursor: "pointer" }}
              title="Cerrar sesión"
            >
              <User size={18} color="#26c6da" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-32 flex flex-col gap-4 mt-2">
          {error && <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>}
          <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>{events.length} eventos agendados</p>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => navigate(`/event/${event.id}`)} />
          ))}
        </div>

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
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onCreate={handleCreateEvent} />}
    </div>
  );
}
