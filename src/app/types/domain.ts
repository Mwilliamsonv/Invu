export type EventStatus = "pendiente" | "realizado" | "cancelado";
export type GuestStatus = "presente" | "ausente";
export type EventRole = "owner" | "editor" | "viewer";

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  providers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventMember {
  uid: string;
  email: string;
  displayName: string;
  role: EventRole;
  invitedAt: string;
}

export interface EventItem {
  id: string;
  name: string;
  status: EventStatus;
  archived?: boolean;
  archivedAt?: string;
  date: string;
  time: string;
  guestCount?: number;
  currentGuestCount?: number;
  location: string;
  description: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestItem {
  id: string;
  guestNumber: number;
  name: string;
  phone: string;
  email: string;
  emailKey: string;
  status: GuestStatus;
  isExtra: boolean;
  qrDataUrl: string;
  braceletNumber?: number;
  inviteStatus?: "pending" | "sent" | "failed";
  inviteSentAt?: string;
  inviteLastAttemptAt?: string;
  inviteError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleWinnerItem {
  id: string;
  guestId: number;
  guestName: string;
  guestBracelet?: number;
  prize: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  name: string;
  status?: EventStatus;
  date: string;
  time: string;
  location?: string;
  description?: string;
}

export interface CreateGuestInput {
  name: string;
  phone?: string;
  email?: string;
  isExtra?: boolean;
}
