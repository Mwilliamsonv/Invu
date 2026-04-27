
# Invu - Firebase Ready

Sistema de gestión de eventos e invitados con:
- Login con Google.
- Login/registro con email y contraseña.
- Eventos por usuario.
- Compartir eventos entre usuarios.
- Invitados por evento con QR en base64.

## 1) Configurar variables de entorno

1. Copia `.env.example` a `.env`.
2. Completa los valores con tu proyecto Firebase.

## 2) Firebase Console

1. Activa **Authentication**:
- Google.
- Email/Password.
2. Activa **Cloud Firestore**.

## 3) Reglas de Firestore

Publica reglas:
`firebase deploy --only firestore:rules --project invi-qr-mwill-2026`

## 4) Ejecutar local

1. `npm install`
2. `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`

## 5) Deploy hosting

1. `npm run build`
2. `firebase deploy --only hosting --project invi-qr-mwill-2026`

## 6) Configurar envío de emails (Resend)

1. Instala dependencias de Functions:
`cd functions && npm install`

2. Configura secretos (reemplaza `re_xxxxxxxxx` por tu API key real):
`firebase functions:secrets:set RESEND_API_KEY`
Valor: `re_xxxxxxxxx`

3. Configura remitente autorizado en Resend:
`firebase functions:secrets:set RESEND_FROM_EMAIL`
Valor ejemplo: `onboarding@resend.dev`

4. Despliega Functions:
`firebase deploy --only functions --project invi-qr-mwill-2026`

5. Define la URL de la Function en `.env`:
`VITE_INVITE_API_URL=https://us-central1-invi-qr-mwill-2026.cloudfunctions.net/sendInvitationEmail`

## Modelo de datos

- `users/{uid}`: perfil del usuario.
- `events/{eventId}`: datos del evento y `memberIds`.
- `events/{eventId}/members/{uid}`: usuarios con acceso al evento.
- `events/{eventId}/guests/{guestId}`: invitados, estado y `qrDataUrl` (base64).
  
