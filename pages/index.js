// pages/index.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle } from '../firebase/firebaseClient';
import { UserContext } from './_app';

export default function Home() {
  const { user } = useContext(UserContext);
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // if already signed in, redirect to calendar
  useEffect(() => {
    if (user) {
      router.replace('/calendar');
    }
  }, [user, router]);

  function getFriendlyMessage(err) {
    if (!err?.code) return 'Something went wrong. Try again.';
    switch (err.code) {
      case 'auth/invalid-email': return 'Please enter a valid email.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/user-not-found': return 'No account found. Please sign up.';
      case 'auth/email-already-in-use': return 'Email already in use.';
      case 'auth/popup-closed-by-user': return 'Google sign-in popup closed.';
      default: return err.message;
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignup) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and confirm password do not match.');
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/calendar');
      } catch (err) {
        setError(getFriendlyMessage(err));
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/calendar');
      } catch (err) {
        setError(getFriendlyMessage(err));
      }
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/calendar');
    } catch (err) {
      setError(getFriendlyMessage(err));
    }
  };

  return (
    <div className="center">
      <div className="card">
        <h1>{isSignup ? 'Create account' : 'Welcome back'}</h1>

        <form onSubmit={handleEmailAuth} className="form">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
          {isSignup && (
            <input
              placeholder="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          )}

          <button type="submit">{isSignup ? 'Create Account' : 'Sign In'}</button>
        </form>

        <button className="google" onClick={handleGoogle}>Sign in with Google</button>

        <p>
          <button className="linklike" onClick={() => setIsSignup(s => !s)}>
            {isSignup ? 'Have an account? Sign in' : 'New here? Create account'}
          </button>
        </p>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
