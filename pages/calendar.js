// pages/calendar.js
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Calendar from '../components/Calendar';
import { auth, deleteCurrentUser, signInWithGoogle } from '../firebase/firebaseClient';

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        // if not logged in, redirect to home
        router.replace('/');
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete account and all your events? This cannot be undone.')) return;
    try {
      await deleteCurrentUser(); // reauth handled inside
      await signOut(auth);
      router.replace('/');
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete account. You may need to re-login and try again.');
    }
  };

  if (!isMounted) return null; // avoid hydration mismatch

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>My Calendar</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 14 }}>{user?.email}</div>
            <button onClick={handleSignOut} style={{ padding: '8px 12px', borderRadius: 6, background: '#111', color: '#fff' }}>Sign out</button>
            <button onClick={handleDeleteAccount} style={{ padding: '8px 12px', borderRadius: 6, background: '#c62828', color: '#fff' }}>Delete account</button>
          </div>
        </header>

        {user ? <Calendar user={user} /> : (
          <div style={{ textAlign: 'center' }}>
            <p>Please sign in.</p>
            <button onClick={() => signInWithGoogle()} style={{ background: '#4285F4', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>Sign in with Google</button>
          </div>
        )}
      </div>
    </div>
  );
}
