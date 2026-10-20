import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import korvilLogo from '../../assets/logo';
import Footer from '../Layout/Footer';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useDocumentTitle(
    isSignUp ? 'Create Account' : 'Sign In',
    'Sign in to Korvil TaskFlow to track tasks, organize personal to-dos, and submit deliverables securely.',
    false
  );

  const { loginWithEmail, signupWithEmail, loginWithGoogle, currentUser, userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Automatically redirect to dashboard if user is already logged in
  useEffect(() => {
    if (currentUser && userProfile) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, userProfile, navigate]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signupWithEmail(email, password, displayName);
        toast.success('Account created successfully!');
      } else {
        await loginWithEmail(email, password);
        toast.success('Welcome back!');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      let msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : err.message || 'Authentication failed';

      if (err.message && (err.message.includes('client is offline') || err.message.includes('offline'))) {
        msg = 'Firestore database not created yet in Firebase Console! Please create it under Firebase Console → Build → Firestore Database.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        let msg = err.message || 'Google sign-in failed';
        if (err.message && (err.message.includes('client is offline') || err.message.includes('offline'))) {
          msg = 'Firestore database not created yet in Firebase Console! Please create it under Firebase Console → Build → Firestore Database.';
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <Link to="/login" className="logo-wrapper" aria-label="Korvil TaskFlow Home">
            <img
              src={korvilLogo}
              alt="Korvil"
              width="64"
              height="64"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = '/korvil-logo.png';
              }}
            />
          </Link>
          <h1>Korvil TaskFlow</h1>
          <p>Smart task management for teams</p>
        </div>

        <div className="login-card">
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

          {error && (
            <div className="error-message" role="alert">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="displayName">Full Name</label>
                <input
                  id="displayName"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isSignUp}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={{ fontSize: 'var(--font-sm)' }}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          Only registered employees can access this platform.
          <br />
          Need an account?{' '}
          <a href="mailto:support@korvil.com" className="email-link" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Contact your administrator
          </a>
        </p>

        <Footer simple />
      </div>
    </div>
  );
}
