import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Plus, Share2, Users } from "lucide-react";
import { QRScannerTab } from "./QRScannerTab";
import { useAuth } from "../providers/AuthProvider";
import {
  addGuestToEvent,
  getEventById,
  markGuestPresent,
  shareEventWithEmail,
  subscribeToGuests,
} from "../lib/events";
import type { EventItem, GuestItem } from "../types/domain";

type Tab = "evento" | "invitados" | "escanear";

export function EventDetailRealtimeScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("evento");
  const [event, setEvent] = useState<EventItem | null>(null);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [sharingEmail, setSharingEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    getEventById(id)
      .then((next) => {
        if (!mounted) return;
        setEvent(next);
        if (!next) setError("Evento no encontrado.");
      })
      .catch(() => setError("No se pudo cargar el evento."))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToGuests(
      id,
      (items) => setGuests(items),
      () => setError("No se pudo cargar invitados."),
    );
    return () => unsub();
  }, [id]);

  const scanGuests = useMemo(
    () =>
      guests.map((g) => ({
        id: g.guestNumber,
        name: g.name,
        email: g.email,
        phone: g.phone,
        present: g.status === "presente",
        extra: g.isExtra,
        bracelet: g.braceletNumber,
      })),
    [guests],
  );

  async function handleAddGuest() {
    if (!id) return;
    if (!newGuestName.trim() || !newGuestEmail.trim()) {
      setError("Nombre y email son obligatorios para el invitado.");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await addGuestToEvent(id, {
        name: newGuestName,
        phone: newGuestPhone,
        email: newGuestEmail,
        isExtra: event?.date === new Date().toISOString().split("T")[0],
      });
      setNewGuestName("");
      setNewGuestPhone("");
      setNewGuestEmail("");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el invitado.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPresent(guestNumber: number, bracelet: number) {
    if (!id) return;
    const target = guests.find((g) => g.guestNumber === guestNumber);
    if (!target) return;
    await markGuestPresent(id, target.id, bracelet);
  }

  async function handleShare() {
    if (!id) return;
    if (!sharingEmail.trim()) {
      setError("Debes ingresar el email del usuario a compartir.");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await shareEventWithEmail(id, sharingEmail, "editor");
      setSharingEmail("");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo compartir el evento.");
    } finally {
      setBusy(false);
    }
  }

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
        <p style={{ color: "#8a9bb0" }}>{error ?? "Evento no encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#e8ecf0" }}>
      <div className="w-full max-w-[390px] min-h-screen" style={{ background: "#e8ecf0" }}>
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "#e8ecf0", boxShadow: "5px 5px 10px #b8bec7, -5px -5px 10px #ffffff", border: "none" }}
          >
            <ArrowLeft size={18} color="#3d4a5c" />
          </button>
          <div>
            <p style={{ fontSize: 12, color: "#8a9bb0", margin: 0 }}>Detalle del evento</p>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#3d4a5c" }}>{event.name}</h1>
          </div>
        </div>

        <div className="px-6 pb-28">
          <div className="flex gap-2 mb-4">
            {(["evento", "invitados", "escanear"] as Tab[]).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className="flex-1 py-2 rounded-2xl"
                style={{
                  border: "none",
                  background: tab === value ? "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)" : "#e8ecf0",
                  color: tab === value ? "#fff" : "#6b7a8d",
                  boxShadow: tab === value ? "4px 4px 10px rgba(0,172,193,0.35)" : "4px 4px 10px #b8bec7, -4px -4px 10px #ffffff",
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {value}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(229,62,62,0.12)", color: "#e53e3e", fontSize: 13 }}>
              {error}
            </div>
          )}

          {tab === "evento" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl p-4" style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#3d4a5c" }}>{event.name}</p>
                <p style={{ margin: 0, marginTop: 6, fontSize: 13, color: "#6b7a8d" }}>{event.date} · {event.time}</p>
                <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: "#6b7a8d" }}>{event.location || "Sin ubicación"}</p>
                <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: "#6b7a8d" }}>{event.description || "Sin descripción"}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Users size={15} color="#00acc1" />
                  <span style={{ fontSize: 12, color: "#3d4a5c", fontWeight: 600 }}>
                    Compartido con {Math.max(event.memberIds.length - 1, 0)} usuarios
                  </span>
                </div>
              </div>

              <div className="rounded-3xl p-4 flex flex-col gap-2" style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#3d4a5c" }}>Compartir evento</p>
                <input
                  type="email"
                  value={sharingEmail}
                  onChange={(e) => setSharingEmail(e.target.value)}
                  placeholder="correo@usuario.com"
                  className="rounded-2xl px-4 py-3 outline-none"
                  style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
                />
                <button
                  onClick={handleShare}
                  disabled={busy}
                  className="py-3 rounded-2xl flex items-center justify-center gap-2"
                  style={{ border: "none", background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)", color: "#fff", fontWeight: 700 }}
                >
                  <Share2 size={16} />
                  Compartir
                </button>
              </div>
            </div>
          )}

          {tab === "invitados" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-3xl p-4 flex flex-col gap-2" style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "#3d4a5c" }}>Agregar invitado</p>
                <input value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} placeholder="Nombre" className="rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
                <input value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)} placeholder="Email (clave)" className="rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
                <input value={newGuestPhone} onChange={(e) => setNewGuestPhone(e.target.value)} placeholder="Teléfono" className="rounded-2xl px-4 py-3 outline-none" style={{ border: "none", background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }} />
                <button onClick={handleAddGuest} disabled={busy} className="py-3 rounded-2xl flex items-center justify-center gap-2" style={{ border: "none", background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)", color: "#fff", fontWeight: 700 }}>
                  <Plus size={16} />
                  Guardar invitado
                </button>
              </div>

              {guests.map((g) => (
                <div key={g.id} className="rounded-2xl p-3" style={{ background: "#e8ecf0", boxShadow: "5px 5px 12px #b8bec7, -5px -5px 12px #ffffff" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "#3d4a5c" }}>#{String(g.guestNumber).padStart(4, "0")} · {g.name}</p>
                      <p style={{ margin: 0, marginTop: 2, fontSize: 12, color: "#6b7a8d" }}>{g.email}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: g.status === "presente" ? "#00897b" : "#f59e0b", background: g.status === "presente" ? "rgba(0,137,123,0.12)" : "rgba(245,158,11,0.12)", borderRadius: 999, padding: "4px 8px" }}>
                      {g.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "escanear" && <QRScannerTab guests={scanGuests} onMarkPresent={handleMarkPresent} />}
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-4" style={{ background: "linear-gradient(to top, #e8ecf0 70%, transparent)" }}>
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "#e8ecf0", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}>
            <span style={{ color: "#6b7a8d", fontWeight: 700, fontSize: 13 }}>
              Invitados presentes: {guests.filter((g) => g.status === "presente").length}/{guests.length}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#00897b", fontWeight: 700, fontSize: 12 }}>
              <Check size={13} /> Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
