// src/pages/Landing.jsx
import { useState } from 'react'
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../firebase/authHelpers'

export default function Landing({ user, username, onPlay, onLeaderboard, onSignedIn }) {
  const [mode, setMode] = useState('home') // home | login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isLoggedIn = !!user && !!username

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      const firebaseUser = await signInWithGoogle()
      if (firebaseUser) onSignedIn(firebaseUser)
    } catch (e) {
      setError('GOOGLE SIGN-IN FAILED. TRY AGAIN.')
      setLoading(false)
    }
  }

  async function handleEmail() {
    if (!email || !password) { setError('FILL IN ALL FIELDS!'); return }
    setLoading(true)
    setError('')
    try {
      const firebaseUser = mode === 'register'
        ? await registerWithEmail(email, password)
        : await loginWithEmail(email, password)
      onSignedIn(firebaseUser)
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use' ? 'EMAIL ALREADY REGISTERED!'
        : e.code === 'auth/user-not-found' ? 'NO ACCOUNT FOUND!'
        : e.code === 'auth/wrong-password' ? 'WRONG PASSWORD!'
        : e.code === 'auth/weak-password' ? 'PASSWORD TOO WEAK! MIN 6 CHARS.'
        : e.code === 'auth/invalid-email' ? 'INVALID EMAIL!'
        : 'SOMETHING WENT WRONG.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f', overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,107,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      {/* Court arc */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 280, height: 140,
        border: '2px solid rgba(255,107,0,0.1)',
        borderBottom: 'none',
        borderRadius: '140px 140px 0 0',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
        width: '100%', maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 'clamp(80px, 24vw, 128px)',
          lineHeight: 0.85, color: '#ff6b00',
          textShadow: '0 0 40px rgba(255,107,0,0.5), 4px 4px 0 #3d1a00',
          letterSpacing: '0.05em',
          animation: 'fadeDown 0.6s ease',
        }}>HOOPZ</div>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 300,
          fontSize: '0.9rem', letterSpacing: '0.5em', color: '#6b5c4a',
          marginTop: 6, marginBottom: 20,
        }}>SHOOT YOUR SHOT</div>

        <span style={{
          fontSize: 56, marginBottom: 24,
          animation: 'bounce 0.9s ease-in-out infinite',
          filter: 'drop-shadow(0 10px 20px rgba(255,107,0,0.4))',
          display: 'block',
        }}>🏀</span>

        {/* LOGGED IN */}
        {isLoggedIn && (
          <>
            <div style={{
              marginBottom: 16, fontFamily: 'Share Tech Mono, monospace',
              fontSize: '0.85rem', color: '#6b5c4a', letterSpacing: '0.1em',
            }}>
              WELCOME BACK, <span style={{ color: '#ff6b00' }}>{username}</span>
            </div>
            <button onClick={onPlay} style={btnMain}>LET'S BALL 🏀</button>
            <button onClick={onLeaderboard} style={{ ...btnGhost, marginTop: 10 }}>🏆 RANKINGS</button>
          </>
        )}

        {/* HOME — not logged in */}
        {!isLoggedIn && mode === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <button onClick={handleGoogle} disabled={loading} style={btnMain}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <GoogleIcon />
                {loading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
              </span>
            </button>
            <button onClick={() => { setMode('login'); setError('') }} style={btnGhost}>
              SIGN IN WITH EMAIL
            </button>
            <button onClick={() => { setMode('register'); setError('') }} style={{ ...btnGhost, borderColor: 'rgba(255,107,0,0.15)', color: '#6b5c4a' }}>
              CREATE ACCOUNT
            </button>
            <button onClick={onLeaderboard} style={{ ...btnGhost, borderColor: 'rgba(255,107,0,0.15)', color: '#6b5c4a' }}>
              🏆 RANKINGS
            </button>
          </div>
        )}

        {/* EMAIL LOGIN / REGISTER */}
        {!isLoggedIn && (mode === 'login' || mode === 'register') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
              color: '#ff6b00', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4,
            }}>
              {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </div>

            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleEmail()}
              style={inputStyle}
            />

            {error && (
              <div style={{ color: '#ff4040', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleEmail} disabled={loading} style={btnMain}>
              {loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN' : 'REGISTER'}
            </button>
            <button onClick={() => { setMode('home'); setError(''); setEmail(''); setPassword('') }} style={btnGhost}>
              ← BACK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3-11.4-7.2l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.7 4.8-5 6.3l6.2 5.2C40 36.2 44 30.6 44 24c0-1.3-.2-2.7-.4-4z"/>
    </svg>
  )
}

const btnMain = {
  width: '100%', background: '#ff6b00', border: 'none', borderRadius: 6,
  padding: '15px', fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.4rem', letterSpacing: '0.1em', color: '#0a0a0f', cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(255,107,0,0.4), 0 2px 0 #3d1a00',
}

const btnGhost = {
  width: '100%', background: 'transparent',
  border: '2px solid rgba(255,107,0,0.3)', borderRadius: 6,
  padding: '13px', fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.3rem', letterSpacing: '0.1em', color: '#ff6b00', cursor: 'pointer',
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,107,0,0.07)',
  border: '2px solid rgba(255,107,0,0.3)',
  borderRadius: 6, padding: '13px 16px',
  color: '#f0e6d3', fontFamily: 'Share Tech Mono, monospace',
  fontSize: '0.9rem', letterSpacing: '0.05em', outline: 'none',
}