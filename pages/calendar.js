// pages/calendar.js
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';
import Calendar from '../components/Calendar';
import { UserContext } from './_app';

export default function CalendarPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) {
      router.replace('/');
    }
  }, [user, router]);

  if (!user) return null; // avoids flash

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>My Calendar</h1>
          <div>
            <span style={{ marginRight: 12 }}>{user.email}</span>
            <button id="signout" style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 6, border: 'none', background: '#111', color: '#fff' }} onClick={async () => {
              const { signOutUser } = await import('../firebase/firebaseClient');
              await signOutUser();
            }}>Sign out</button>
          </div>
        </header>

        <Calendar user={user} />
      </div>
    </div>
  );
}
