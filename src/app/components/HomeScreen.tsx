import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  User,
  ChevronRight,
} from "lucide-react";

type EventStatus = "realizado" | "pendiente" | "cancelado";

export interface AppEvent {
  id: number;
  name: string;
  date: string;
  time: string;
  status: EventStatus;
  guests: number;
  location?: string;
  description?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

export const EVENTS_DATA: AppEvent[] = [
  {
    id: 1,
    name: "Feria de tecnología",
    date: TODAY,
    time: "10:00",
    status: "pendiente",
    guests: 52,
    location: "Centro de Convenciones Norte",
    description: "Exposición anual de innovación tecnológica.",
  },
  {
    id: 2,
    name: "Cumpleaños de Ana",
    date: "2026-05-03",
    time: "19:00",
    status: "realizado",
    guests: 24,
    location: "Salón Las Palmas",
    description: "Celebración de cumpleaños sorpresa.",
  },
  {
    id: 3,
    name: "Reunión de equipo",
    date: "2026-05-07",
    time: "10:30",
    status: "realizado",
    guests: 8,
    location: "Oficina Central - Sala A",
    description: "Revisión de resultados del trimestre.",
  },
  {
    id: 4,
    name: "Boda de Carlos & Sofía",
    date: "2026-05-15",
    time: "17:00",
    status: "pendiente",
    guests: 120,
    location: "Hacienda El Roble",
    description: "Ceremonia y recepción nupcial.",
  },
  {
    id: 5,
    name: "Cena corporativa",
    date: "2026-06-01",
    time: "21:00",
    status: "cancelado",
    guests: 40,
    location: "Restaurante Gran Vía",
    description: "Cena de fin de año para directivos.",
  },
];

type DisplayStatus = EventStatus | "en_curso";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  en_curso:  { label: "En curso",  color: "#7c3aed", bg: "rgba(124,58,237,0.12)", dot: "#7c3aed" },
  realizado: { label: "Realizado", color: "#00897b", bg: "rgba(0,137,123,0.10)",  dot: "#00897b" },
  pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", dot: "#f59e0b" },
  cancelado: { label: "Cancelado", color: "#e53e3e", bg: "rgba(229,62,62,0.10)",  dot: "#e53e3e" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function getDisplayStatus(event: AppEvent): DisplayStatus {
  if (event.date === TODAY && event.status !== "cancelado") return "en_curso";
  return event.status;
}

function EventCard({ event, onClick }: { event: AppEvent; onClick: () => void }) {
  const displayStatus: DisplayStatus = getDisplayStatus(event);
  const isActive = displayStatus === "en_curso";
  const statusCfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG["pendiente"];

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
      {/* Active left stripe */}
      {isActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
          style={{ background: "linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%)" }}
        />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Icon bubble */}
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
            {/* Status badge */}
            <div
              className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full"
              style={{ background: statusCfg.bg }}
            >
              {isActive ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#7c3aed" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#7c3aed" }} />
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot, display: "inline-block" }} />
              )}
              <span style={{ fontSize: "11px", color: statusCfg.color, fontWeight: 700 }}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* HOY chip + arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive && (
            <div
              className="px-2.5 py-1 rounded-xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}
            >
              HOY
            </div>
          )}
          <ChevronRight size={16} color={isActive ? "#7c3aed" : "#b8bec7"} strokeWidth={2} />
        </div>
      </div>

      {/* Info pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}
        >
          <Calendar size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>
            {formatDate(event.date)}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}
        >
          <Clock size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>
            {event.time}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: isActive ? "rgba(237,233,254,0.6)" : "#e8ecf0", boxShadow: "inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff" }}
        >
          <Users size={11} color={isActive ? "#7c3aed" : "#8a9bb0"} strokeWidth={2} />
          <span style={{ fontSize: "12px", color: isActive ? "#5b21b6" : "#6b7a8d", fontWeight: 500 }}>
            {event.guests} invitados
          </span>
        </div>
      </div>
    </button>
  );
}

function NewEventModal({ onClose }: { onClose: () => void }) {
  const [name, setName]     = useState("");
  const [date, setDate]     = useState("");
  const [time, setTime]     = useState("");
  const [guests, setGuests] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fieldStyle = (field: string) => ({
    background: "#e8ecf0",
    boxShadow: focusedField === field
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.18)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
        </div>

        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#3d4a5c", margin: 0 }}>
          Nuevo evento
        </h2>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Nombre del evento</label>
          <input type="text" placeholder="Ej. Cumpleaños de María" value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
            style={fieldStyle("name")} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              onFocus={() => setFocusedField("date")} onBlur={() => setFocusedField(null)}
              style={fieldStyle("date")} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Hora</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              onFocus={() => setFocusedField("time")} onBlur={() => setFocusedField(null)}
              style={fieldStyle("time")} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>Número de invitados</label>
          <input type="number" placeholder="0" min="0" value={guests}
            onChange={(e) => setGuests(e.target.value)}
            onFocus={() => setFocusedField("guests")} onBlur={() => setFocusedField(null)}
            style={fieldStyle("guests")} />
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl"
            style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, color: "#8a9bb0" }}>
            Cancelar
          </button>
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)", boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
            Crear evento
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const [events]    = useState<AppEvent[]>(EVENTS_DATA);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "#e8ecf0" }}>

        {/* Header */}
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>
                Bienvenido de nuevo
              </p>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
                Mis Eventos
              </h1>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none", cursor: "pointer" }}
              title="Cerrar sesión"
            >
              <User size={18} color="#26c6da" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 px-6 pb-32 flex flex-col gap-4 mt-2">
          <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>
            {events.length} eventos agendados
          </p>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/event/${event.id}`)}
            />
          ))}
        </div>

        {/* FAB */}
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
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(0,120,140,0.4), inset -2px -2px 4px rgba(255,255,255,0.2)"; }}
            onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 16px rgba(0,172,193,0.45), -2px -2px 8px rgba(255,255,255,0.6)"; }}
            onMouseLeave={(e)=> { (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 16px rgba(0,172,193,0.45), -2px -2px 8px rgba(255,255,255,0.6)"; }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            Agregar evento
          </button>
        </div>
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
