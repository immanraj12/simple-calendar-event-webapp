// firebase/firebaseClient.js
import { getApps, initializeApp } from 'firebase/app';
import {
  signInWithPopup as _signInWithPopup,
  signOut as _signOut,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate init (Next.js hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return _signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return _signOut(auth);
}

/**
 * Delete current user. If Firebase requires recent login, reauthenticate with Google popup and retry.
 */
export async function deleteCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');

  try {
    await deleteUser(user);
  } catch (err) {
    // requires recent login -> reauthenticate using popup (Google)
    if (err?.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, googleProvider);
      await deleteUser(user);
    } else {
      throw err;
    }
  }
}
