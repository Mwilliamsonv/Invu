import { useState } from "react";
import QRCode from "qrcode";
import {
  Send,
  Check,
  X,
  Mail,
  Loader,
  Users,
  QrCode,
} from "lucide-react";

export interface GuestToInvite {
  id: number;
  name: string;
  email?: string;
}

interface SendInvitationsModalProps {
  guests: GuestToInvite[];
  onClose: () => void;
}

type Step = "compose" | "sending" | "done";

interface GuestStatus {
  guest: GuestToInvite;
  qrUrl: string;
  status: "pending" | "generating" | "sending" | "done" | "error";
}

// ── Simulates sending one invite (QR generation + email) ─────────────────────
async function processGuest(
  guest: GuestToInvite,
  onUpdate: (status: GuestStatus["status"], qrUrl?: string) => void
) {
  onUpdate("generating");
  await delay(400 + Math.random() * 300);

  const content = `ID: ${String(guest.id).padStart(4, "0")}\nNombre: ${guest.name}`;
  const qrUrl = await QRCode.toDataURL(content, {
    margin: 1,
    width: 180,
    color: { dark: "#3d4a5c", light: "#e8ecf0" },
  });

  onUpdate("sending", qrUrl);
  await delay(500 + Math.random() * 400);

  onUpdate("done", qrUrl);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: GuestStatus["status"] }) {
  if (status === "pending") {
    return (
      <div className="w-6 h-6 rounded-full" style={{ background: "#d8dfe8" }} />
    );
  }
  if (status === "generating" || status === "sending") {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: "rgba(38,198,218,0.15)" }}
      >
        <Loader
          size={13}
          color="#26c6da"
          strokeWidth={2.5}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (status === "done") {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,137,123,0.15)" }}
      >
        <Check size={13} color="#00897b" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ background: "rgba(229,62,62,0.12)" }}
    >
      <X size={13} color="#e53e3e" strokeWidth={2.5} />
    </div>
  );
}

// ── Status label ──────────────────────────────────────────────────────────────
function statusLabel(status: GuestStatus["status"]) {
  if (status === "pending")    return { text: "En espera",        color: "#a0aec0" };
  if (status === "generating") return { text: "Generando QR...",  color: "#26c6da" };
  if (status === "sending")    return { text: "Enviando correo...", color: "#f59e0b" };
  if (status === "done")       return { text: "Enviado",          color: "#00897b" };
  return                              { text: "Error",            color: "#e53e3e" };
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function SendInvitationsModal({ guests, onClose }: SendInvitationsModalProps) {
  const defaultMsg =
    `Hola [Nombre],\n\nTe invitamos al evento. Adjunto encontrarás tu código QR de acceso.\n\nPor favor, presentalo al ingresar al evento.\n\n¡Te esperamos!`;

  const [step, setStep]       = useState<Step>("compose");
  const [message, setMessage] = useState(defaultMsg);
  const [statuses, setStatuses] = useState<GuestStatus[]>(
    guests.map((g) => ({ guest: g, qrUrl: "", status: "pending" }))
  );
  const [doneCount, setDoneCount] = useState(0);

  const handleSend = async () => {
    setStep("sending");
    let done = 0;

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];

      const updateStatus = (status: GuestStatus["status"], qrUrl?: string) => {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status, qrUrl: qrUrl ?? s.qrUrl } : s
          )
        );
        if (status === "done") {
          done++;
          setDoneCount(done);
        }
      };

      await processGuest(guest, updateStatus);
    }

    setStep("done");
  };

  const progress = guests.length > 0 ? (doneCount / guests.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(60,80,100,0.22)", backdropFilter: "blur(3px)" }}
      onClick={step === "done" ? onClose : undefined}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{
          background: "#e8ecf0",
          boxShadow: "-4px -4px 20px rgba(255,255,255,0.8), 0px -6px 20px rgba(184,190,199,0.5)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center -mb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#b8bec7" }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e8ecf0", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff" }}
          >
            <Send size={17} color="#26c6da" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#3d4a5c", margin: 0 }}>
              Enviar Invitaciones
            </h2>
            <p style={{ fontSize: "11px", color: "#8a9bb0", margin: 0 }}>
              {guests.length} {guests.length === 1 ? "destinatario" : "destinatarios"}
            </p>
          </div>
          {step !== "sending" && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <X size={18} color="#a0aec0" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── STEP: COMPOSE ── */}
        {step === "compose" && (
          <>
            {/* Recipients summary */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(38,198,218,0.07)", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
            >
              <Users size={15} color="#26c6da" strokeWidth={2} />
              <div className="flex-1">
                {guests.length === 1 ? (
                  <p style={{ fontSize: "13px", color: "#3d4a5c", margin: 0, fontWeight: 600 }}>
                    {guests[0].name}
                    {guests[0].email && (
                      <span style={{ fontWeight: 400, color: "#8a9bb0" }}> — {guests[0].email}</span>
                    )}
                  </p>
                ) : (
                  <p style={{ fontSize: "13px", color: "#3d4a5c", margin: 0, fontWeight: 500 }}>
                    Se enviarán a{" "}
                    <span style={{ fontWeight: 700, color: "#26c6da" }}>{guests.length} invitados</span>.
                    Cada correo incluirá su QR individual.
                  </p>
                )}
              </div>
            </div>

            {/* QR info */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "#e8ecf0", boxShadow: "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff" }}
            >
              <QrCode size={15} color="#7c3aed" strokeWidth={2} />
              <p style={{ fontSize: "12px", color: "#3d4a5c", margin: 0, lineHeight: 1.5 }}>
                Se generará un QR único por invitado con su{" "}
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>ID y Nombre</span>{" "}
                y se adjuntará al correo.
              </p>
            </div>

            {/* Message textarea */}
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
                Mensaje del correo
              </label>
              <div
                className="rounded-2xl p-4"
                style={{ background: "#e8ecf0", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}
              >
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    fontSize: "13px",
                    color: "#3d4a5c",
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "#e8ecf0",
                  boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#8a9bb0",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                  boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                Aceptar
              </button>
            </div>
          </>
        )}

        {/* ── STEP: SENDING ── */}
        {step === "sending" && (
          <div className="flex flex-col gap-4">
            {/* Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "12px", color: "#8a9bb0", fontWeight: 500 }}>
                  Procesando invitaciones...
                </span>
                <span style={{ fontSize: "12px", color: "#26c6da", fontWeight: 700 }}>
                  {doneCount}/{guests.length}
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: "#d0d6de", boxShadow: "inset 2px 2px 4px #b8bec7, inset -2px -2px 4px #ffffff" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #26c6da, #00acc1)",
                  }}
                />
              </div>
            </div>

            {/* Guest list */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff", maxHeight: 300, overflowY: "auto" }}
            >
              {statuses.map((s, i) => {
                const lbl = statusLabel(s.status);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < statuses.length - 1 ? "1px solid #d8dfe8" : "none" }}
                  >
                    {/* QR preview if done */}
                    {s.qrUrl ? (
                      <img
                        src={s.qrUrl}
                        alt="QR"
                        style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "#fff" }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(160,174,192,0.10)" }}
                      >
                        <QrCode size={16} color="#a0aec0" strokeWidth={1.8} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#3d4a5c", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.guest.name}
                      </p>
                      <p style={{ fontSize: "10px", color: lbl.color, margin: 0, fontWeight: 500 }}>
                        {lbl.text}
                      </p>
                    </div>

                    <StatusIcon status={s.status} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(0,137,123,0.12)", boxShadow: "6px 6px 14px #b8bec7, -6px -6px 14px #ffffff" }}
              >
                <Mail size={28} color="#00897b" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#00897b", margin: 0 }}>
                  Invitaciones enviadas
                </p>
                <p style={{ fontSize: "13px", color: "#8a9bb0", margin: 0, marginTop: 6, lineHeight: 1.5 }}>
                  Se enviaron{" "}
                  <span style={{ color: "#3d4a5c", fontWeight: 700 }}>{doneCount}</span>{" "}
                  {doneCount === 1 ? "invitación" : "invitaciones"} con QR adjunto.
                </p>
              </div>
            </div>

            {/* Summary list (compact) */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff", maxHeight: 220, overflowY: "auto" }}
            >
              {statuses.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < Math.min(statuses.length, 5) - 1 ? "1px solid #d8dfe8" : "none" }}
                >
                  {s.qrUrl && (
                    <img src={s.qrUrl} alt="QR" style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: "13px", color: "#3d4a5c", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.guest.name}
                  </span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,137,123,0.15)" }}>
                    <Check size={11} color="#00897b" strokeWidth={2.5} />
                  </div>
                </div>
              ))}
              {statuses.length > 5 && (
                <div className="flex items-center justify-center px-4 py-2">
                  <span style={{ fontSize: "11px", color: "#a0aec0" }}>
                    +{statuses.length - 5} más
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
                boxShadow: "5px 5px 12px rgba(0,172,193,0.4), -2px -2px 8px rgba(255,255,255,0.5)",
                border: "none",
                borderRadius: "16px",
                padding: "15px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
