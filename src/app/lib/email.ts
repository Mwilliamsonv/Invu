import { auth } from "./firebase";

const DEFAULT_INVITE_API_URL =
  "https://us-central1-invi-qr-mwill-2026.cloudfunctions.net/sendInvitationEmail";

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildInviteHtml(params: {
  guestName: string;
  message: string;
  qrDataUrl: string;
}) {
  const messageHtml = escapeHtml(params.message).replaceAll("\n", "<br/>");
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
      <h2 style="margin:0 0 8px 0;color:#111827;">Invitación al evento</h2>
      <p style="margin:0 0 16px 0;color:#374151;">Hola <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#374151;line-height:1.5;">${messageHtml}</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:12px;display:inline-block;">
        <img src="${params.qrDataUrl}" alt="Código QR de acceso" style="width:220px;height:220px;display:block;" />
      </div>
      <p style="font-size:12px;color:#6b7280;margin-top:12px;">Presenta este QR en el acceso del evento.</p>
    </div>
  `;
}

export async function sendInvitationEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No hay sesión activa para enviar invitaciones.");
  }
  const token = await currentUser.getIdToken();
  const endpoint = import.meta.env.VITE_INVITE_API_URL || DEFAULT_INVITE_API_URL;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof body?.details === "string"
        ? body.details
        : body?.details?.message || body?.details?.error || body?.error;
    throw new Error(detail || "No se pudo enviar la invitación.");
  }

  return body;
}
