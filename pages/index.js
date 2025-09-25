// pages/index.js
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { auth, signInWithGoogle } from '../firebase/firebaseClient';
import { UserContext } from './_app';

export default function Home() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useContext(UserContext);
  const router = useRouter();

  if (user) {
    if (typeof window !== 'undefined') router.replace('/calendar');
    return null;
  }

  // Email/Password signup/login
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignup && password.length < 6) {
      setError('❌ Password must be at least 6 characters.');
      return;
    }

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/calendar');
    } catch (err) {
      setError(getFriendlyMessage(err));
    }
  };

  // Google Sign-In with automatic account linking
  const handleGoogle = async () => {
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      if (auth.currentUser) {
        // If already logged in (email/password), link Google
        await linkWithPopup(auth.currentUser, provider);
        console.log('✅ Google account linked to existing user!');
      } else {
        // Sign in with Google normally
        await signInWithGoogle();
      }
      router.push('/calendar');
    } catch (err) {
      // Handle account-exists-with-different-credential
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError(
          '❌ You already have an account with this email using another method. Please login first and then link Google.'
        );
      } else {
        setError(getFriendlyMessage(err));
      }
    }
  };

  // Friendly error messages
  function getFriendlyMessage(err) {
    if (!err?.code) return '❌ Something went wrong. Please try again.';
    switch (err.code) {
      case 'auth/invalid-email':
        return '❌ Please enter a valid email address.';
      case 'auth/missing-password':
        return '❌ Please enter a password.';
      case 'auth/weak-password':
        return '❌ Password should be at least 6 characters long.';
      case 'auth/user-not-found':
        return '❌ No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '❌ Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return '❌ An account with this email already exists. Please log in instead.';
      case 'auth/popup-closed-by-user':
        return '❌ Google sign-in popup was closed before completing.';
      default:
        return `❌ ${err.message}`;
    }
  }

  return (
    <div className="center">
      <div className="card">
        <h1>{isSignup ? 'Sign Up' : 'Login'}</h1>

        <form onSubmit={handleEmailAuth} className="form">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button className="google" onClick={handleGoogle}>
          Sign in with Google
        </button>

        <p>
          <button
            className="linklike"
            onClick={() => setIsSignup((s) => !s)}
          >
            {isSignup ? 'Have an account? Login' : 'New? Create account'}
          </button>
        </p>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
