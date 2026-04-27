const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");

admin.initializeApp();

const resendApiKey = defineSecret("RESEND_API_KEY");
const resendFrom = defineSecret("RESEND_FROM_EMAIL");

function extractInlineQrAttachment(html) {
  if (typeof html !== "string" || !html.includes("data:image")) {
    return { html, attachment: null };
  }

  const dataUriRegex = /src="(data:image\/([a-zA-Z0-9.+-]+);base64,([^"]+))"/i;
  const match = html.match(dataUriRegex);
  if (!match) return { html, attachment: null };

  const mimeType = `image/${(match[2] || "png").toLowerCase()}`;
  const base64Content = (match[3] || "").trim();
  if (!base64Content) return { html, attachment: null };

  const cid = "invite-qr";
  const safeHtml = html.replace(match[1], `cid:${cid}`);

  return {
    html: safeHtml,
    attachment: {
      filename: "codigo-qr.png",
      content: base64Content,
      contentType: mimeType,
      cid,
    },
  };
}

function cors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

exports.sendInvitationEmail = onRequest(
  { region: "us-central1", secrets: [resendApiKey, resendFrom] },
  async (req, res) => {
    cors(res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }

    try {
      await admin.auth().verifyIdToken(token);
    } catch (_) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const { to, subject, html } = req.body || {};
    if (!to || !subject || !html) {
      res.status(400).json({ error: "Missing required fields: to, subject, html" });
      return;
    }

    try {
      const { html: finalHtml, attachment } = extractInlineQrAttachment(html);
      const resend = new Resend(resendApiKey.value());
      const result = await resend.emails.send({
        from: resendFrom.value(),
        to,
        subject,
        html: finalHtml,
        attachments: attachment ? [attachment] : undefined,
      });

      res.status(200).json({ ok: true, id: result?.data?.id || null });
    } catch (error) {
      res.status(500).json({
        error: "Failed to send email",
        details: error?.message || String(error),
      });
    }
  },
);
