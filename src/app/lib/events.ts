import QRCode from "qrcode";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  CreateEventInput,
  CreateGuestInput,
  EventItem,
  EventMember,
  EventRole,
  EventStatus,
  GuestItem,
  GuestStatus,
} from "../types/domain";

function nowIso() {
  return new Date().toISOString();
}

function toEventItem(id: string, data: any): EventItem {
  return {
    id,
    name: data.name ?? "",
    status: (data.status ?? "pendiente") as EventStatus,
    date: data.date ?? "",
    time: data.time ?? "",
    guestCount: Number(data.guestCount ?? 0),
    currentGuestCount: Number(data.currentGuestCount ?? 0),
    location: data.location ?? "",
    description: data.description ?? "",
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    createdBy: data.createdBy ?? "",
    createdAt: data.createdAt ?? nowIso(),
    updatedAt: data.updatedAt ?? nowIso(),
  };
}

function toGuestItem(id: string, data: any): GuestItem {
  return {
    id,
    guestNumber: Number(data.guestNumber ?? 0),
    name: data.name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    emailKey: data.emailKey ?? "",
    status: (data.status ?? "ausente") as GuestStatus,
    isExtra: Boolean(data.isExtra),
    qrDataUrl: data.qrDataUrl ?? "",
    braceletNumber:
      typeof data.braceletNumber === "number" ? data.braceletNumber : undefined,
    inviteStatus: data.inviteStatus ?? "pending",
    inviteSentAt: data.inviteSentAt ?? "",
    inviteLastAttemptAt: data.inviteLastAttemptAt ?? "",
    inviteError: data.inviteError ?? "",
    createdAt: data.createdAt ?? nowIso(),
    updatedAt: data.updatedAt ?? nowIso(),
  };
}

async function generateGuestQrDataUrl(eventId: string, guestNumber: number, name: string) {
  const payload = JSON.stringify({
    eventId,
    id: guestNumber,
    name,
  });
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}

export function subscribeToMyEvents(
  uid: string,
  onData: (events: EventItem[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = query(
    collection(db, "events"),
    where("memberIds", "array-contains", uid),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => toEventItem(d.id, d.data()));
      onData(items);
    },
    onError,
  );
}

export async function createEventForUser(
  uid: string,
  ownerEmail: string,
  ownerName: string,
  input: CreateEventInput,
) {
  const now = nowIso();
  const eventRef = doc(collection(db, "events"));
  const eventId = eventRef.id;

  const eventData: Omit<EventItem, "id"> = {
    name: input.name.trim(),
    status: input.status ?? "pendiente",
    date: input.date,
    time: input.time,
    guestCount: 0,
    currentGuestCount: 0,
    location: input.location?.trim() ?? "",
    description: input.description?.trim() ?? "",
    memberIds: [uid],
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  };

  const ownerMember: EventMember = {
    uid,
    email: ownerEmail,
    displayName: ownerName,
    role: "owner",
    invitedAt: now,
  };

  await runTransaction(db, async (tx) => {
    tx.set(eventRef, eventData);
    tx.set(doc(db, "events", eventId, "members", uid), ownerMember);
  });

  return eventId;
}

export async function shareEventWithUser(
  eventId: string,
  sharedUserUid: string,
  email: string,
  displayName: string,
  role: EventRole = "editor",
) {
  const eventRef = doc(db, "events", eventId);
  const memberRef = doc(db, "events", eventId, "members", sharedUserUid);
  const member: EventMember = {
    uid: sharedUserUid,
    email,
    displayName,
    role,
    invitedAt: nowIso(),
  };

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error("El evento no existe.");
    }
    tx.update(eventRef, {
      memberIds: arrayUnion(sharedUserUid),
      updatedAt: nowIso(),
    });
    tx.set(memberRef, member, { merge: true });
  });
}

export async function shareEventWithEmail(
  eventId: string,
  email: string,
  role: EventRole = "editor",
) {
  const emailKey = email.trim().toLowerCase();
  const usersQuery = query(collection(db, "users"), where("email", "==", emailKey));
  const usersSnap = await getDocs(usersQuery);
  if (usersSnap.empty) {
    throw new Error("No existe un usuario registrado con ese email.");
  }
  const userData = usersSnap.docs[0].data();
  const uid = usersSnap.docs[0].id;
  await shareEventWithUser(
    eventId,
    uid,
    userData.email ?? emailKey,
    userData.displayName ?? emailKey,
    role,
  );
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return toEventItem(snap.id, snap.data());
}

export function subscribeToGuests(
  eventId: string,
  onData: (guests: GuestItem[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = query(
    collection(db, "events", eventId, "guests"),
    orderBy("guestNumber", "asc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => toGuestItem(d.id, d.data()));
      onData(items);
    },
    onError,
  );
}

export async function addGuestToEvent(eventId: string, input: CreateGuestInput) {
  const emailRaw = (input.email ?? "").trim();
  const emailKey = emailRaw.toLowerCase();
  const isExtra = Boolean(input.isExtra);
  const shouldMarkPresent = isExtra;

  if (!emailKey && !isExtra) {
    throw new Error("El email del invitado es obligatorio para este tipo de evento.");
  }

  const guestsRef = collection(db, "events", eventId, "guests");
  if (emailKey) {
    const existsQuery = query(guestsRef, where("emailKey", "==", emailKey));
    const existsSnap = await getDocs(existsQuery);
    if (!existsSnap.empty) {
      throw new Error("Ya existe un invitado con ese email en este evento.");
    }
  }

  const now = nowIso();
  const eventRef = doc(db, "events", eventId);
  const guestRef = doc(guestsRef);

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error("No se encontró el evento.");
    }

    const count = Number(eventSnap.data().guestCount ?? 0);
    const guestNumber = count + 1;
    const qrDataUrl = await generateGuestQrDataUrl(eventId, guestNumber, input.name);

    tx.set(guestRef, {
      guestNumber,
      name: input.name.trim(),
      phone: input.phone?.trim() ?? "",
      email: emailRaw,
      emailKey,
      status: shouldMarkPresent ? "presente" : "ausente",
      isExtra,
      inviteStatus: "pending",
      inviteError: "",
      inviteLastAttemptAt: "",
      inviteSentAt: "",
      qrDataUrl,
      createdAt: now,
      updatedAt: now,
    });

    tx.update(eventRef, {
      guestCount: guestNumber,
      currentGuestCount: Number(eventSnap.data().currentGuestCount ?? 0) + 1,
      updatedAt: now,
    });
  });
}

export async function markGuestPresent(
  eventId: string,
  guestId: string,
  braceletNumber: number,
) {
  const guestRef = doc(db, "events", eventId, "guests", guestId);
  await updateDoc(guestRef, {
    status: "presente",
    braceletNumber,
    updatedAt: nowIso(),
  });
}

export async function setGuestInvitationStatus(
  eventId: string,
  guestId: string,
  payload: { status: "pending" | "sent" | "failed"; error?: string },
) {
  const now = nowIso();
  const guestRef = doc(db, "events", eventId, "guests", guestId);
  await updateDoc(guestRef, {
    inviteStatus: payload.status,
    inviteError: payload.error ?? "",
    inviteLastAttemptAt: now,
    inviteSentAt: payload.status === "sent" ? now : "",
    updatedAt: now,
  });
}

export async function deleteGuestFromEvent(eventId: string, guestId: string) {
  const eventRef = doc(db, "events", eventId);
  const guestRef = doc(db, "events", eventId, "guests", guestId);

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error("No se encontró el evento.");
    }
    const current = Number(eventSnap.data().currentGuestCount ?? 0);
    tx.update(eventRef, {
      currentGuestCount: current > 0 ? current - 1 : 0,
      updatedAt: nowIso(),
    });
    tx.delete(guestRef);
  });
}
