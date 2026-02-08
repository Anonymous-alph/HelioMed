import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CustomCursor from '../../components/CustomCursor';
import ThreeBackground from '../../components/ThreeBackground';
import styles from './Login.module.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await register(email, password, name || undefined);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <CustomCursor />
      <div className={styles.authContainer}>
        <div className={styles.authLeft}>
          <Link to="/" className={styles.backLink}>
            &larr; Back to home
          </Link>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <Link to="/" className={styles.logo}>
                <div className={styles.logoIcon}>&#9877;</div>
                Helio Med
              </Link>
              <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
              <p>{isSignUp ? 'Sign up to get started' : 'Sign in to your account'}</p>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <form className={styles.authForm} onSubmit={handleSubmit}>
              {isSignUp && (
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className={styles.authFooter}>
              {isSignUp ? (
                <p>Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setError(''); }}>
                    Sign In
                  </a>
                </p>
              ) : (
                <p>Don&apos;t have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setError(''); }}>
                    Sign Up
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.authRight}>
          <ThreeBackground />
          <div className={styles.authVisual}>
            <div className={styles.visualContent}>
              <h2>Your Health, <span>Simplified</span></h2>
              <p>AI-powered medical consultations, prescriptions, and pharmacy locator — all in one place.</p>
              <div className={styles.visualFeatures}>
                <div className={styles.visualFeature}>
                  <span className={styles.featureIcon}>&#127897;</span>
                  <span>Voice-powered consultations</span>
                </div>
                <div className={styles.visualFeature}>
                  <span className={styles.featureIcon}>&#128138;</span>
                  <span>AI prescription generation</span>
                </div>
                <div className={styles.visualFeature}>
                  <span className={styles.featureIcon}>&#128269;</span>
                  <span>Nearby pharmacy finder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
