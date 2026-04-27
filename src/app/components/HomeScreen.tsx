import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Plus, User, Users } from "lucide-react";
import { createEventForUser, subscribeToMyEvents } from "../lib/events";
import type { EventItem } from "../types/domain";
import { useAuth } from "../providers/AuthProvider";

function EventCard({ event, onOpen }: { event: EventItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-3xl p-5 text-left"
      style={{
        background: "#e8ecf0",
        boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff",
        border: "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#3d4a5c" }}>{event.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#8a9bb0", marginTop: 3 }}>
            {event.date} · {event.time}
          </p>
        </div>
        <span
          className="px-2 py-1 rounded-full"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: event.status === "cancelado" ? "#e53e3e" : event.status === "realizado" ? "#00897b" : "#f59e0b",
            background:
              event.status === "cancelado"
                ? "rgba(229,62,62,0.12)"
                : event.status === "realizado"
                  ? "rgba(0,137,123,0.12)"
                  : "rgba(245,158,11,0.12)",
          }}
        >
          {event.status}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Calendar size={14} color="#8a9bb0" />
        <span style={{ fontSize: 12, color: "#6b7a8d" }}>{event.location || "Sin ubicación"}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Users size={14} color="#8a9bb0" />
        <span style={{ fontSize: 12, color: "#6b7a8d" }}>
          Compartido con {Math.max(event.memberIds.length - 1, 0)} usuarios
        </span>
      </div>
    </button>
  );
}

function NewEventModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; date: string; time: string; location: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.18)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-3"
        style={{ background: "#e8ecf0", boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0 -6px 20px rgba(184,190,199,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#3d4a5c", marginBottom: 4 }}>Nuevo evento</h2>
        {error && (
          <div className="rounded-xl px-3 py-2" style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 12 }}>
            {error}
          </div>
        )}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
        </div>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ubicación" className="rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" rows={3} className="rounded-2xl px-4 py-3 outline-none resize-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl" style={{ border: "none", background: "#e8ecf0", boxShadow: "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff" }}>Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-2xl" style={{ border: "none", background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)", color: "#fff", fontWeight: 700 }}>
            {saving ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyEvents(
      user.uid,
      (nextEvents) => {
        setEvents(nextEvents);
        setLoading(false);
      },
      () => {
        setError("No se pudieron cargar los eventos.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const welcomeName = useMemo(
    () => user?.displayName || user?.email?.split("@")[0] || "Usuario",
    [user],
  );

  async function createEvent(payload: {
    name: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }) {
    if (!user?.email) {
      throw new Error("No se encontró correo del usuario autenticado.");
    }
    await createEventForUser(
      user.uid,
      user.email,
      user.displayName ?? user.email.split("@")[0],
      payload,
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen flex flex-col" style={{ background: "#e8ecf0" }}>
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "13px", color: "#8a9bb0", fontWeight: 500, margin: 0 }}>Hola, {welcomeName}</p>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>Mis eventos</h1>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none" }}
              title="Cerrar sesión"
            >
              <User size={18} color="#26c6da" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-32 flex flex-col gap-4 mt-2">
          {error && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 13 }}>
              {error}
            </div>
          )}
          {loading && <p style={{ color: "#8a9bb0", margin: 0 }}>Cargando eventos...</p>}
          {!loading && events.length === 0 && (
            <div className="rounded-3xl p-6" style={{ background: "#e8ecf0", boxShadow: "inset 6px 6px 12px #b8bec7, inset -6px -6px 12px #ffffff" }}>
              <p style={{ margin: 0, color: "#6b7a8d", fontWeight: 600 }}>Aún no tienes eventos. Crea el primero con el botón de abajo.</p>
            </div>
          )}
          {events.map((event) => (
            <EventCard key={event.id} event={event} onOpen={() => navigate(`/event/${event.id}`)} />
          ))}
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-6 pointer-events-none">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 pointer-events-auto"
            style={{
              background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
              boxShadow: "6px 6px 16px rgba(0,172,193,0.45), -2px -2px 8px rgba(255,255,255,0.6)",
              border: "none",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            <Plus size={20} color="#fff" />
            Agregar evento
          </button>
        </div>
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onCreate={createEvent} />}
    </div>
  );
}
