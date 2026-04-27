import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import type { AppUserProfile } from "../types/domain";

function nowIso() {
  return new Date().toISOString();
}

export async function upsertUserProfile(user: User): Promise<void> {
  const email = (user.email ?? "").toLowerCase();
  const displayName = user.displayName ?? email.split("@")[0] ?? "Usuario";
  const profile: AppUserProfile = {
    uid: user.uid,
    email,
    displayName,
    photoURL: user.photoURL ?? undefined,
    providers: user.providerData.map((p) => p.providerId),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await setDoc(doc(db, "users", user.uid), profile, { merge: true });
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await upsertUserProfile(result.user);
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserProfile(result.user);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  if (displayName.trim()) {
    await setDoc(
      doc(db, "users", result.user.uid),
      {
        uid: result.user.uid,
        email: normalizedEmail,
        displayName: displayName.trim(),
        providers: ["password"],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      { merge: true },
    );
  } else {
    await upsertUserProfile(result.user);
  }
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
