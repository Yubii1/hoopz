// src/pages/UsernameSetup.jsx
import { useState } from 'react'
import { saveUsername, reserveUsername, isUsernameTaken } from '../firebase/authHelpers'

export default function UsernameSetup({ user, onDone }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    const trimmed = username.trim().toUpperCase().replace(/\s+/g, '_')
    if (!trimmed || trimmed.length < 2) {
      setError('AT LEAST 2 CHARACTERS!')
      return
    }
    if (trimmed.length > 14) {
      setError('MAX 14 CHARACTERS!')
      return
    }
    if (!/^[A-Z0-9_]+$/.test(trimmed)) {
      setError('LETTERS, NUMBERS & _ ONLY')
      return
    }

    setLoading(true)
    setError('')
    try {
      const taken = await isUsernameTaken(trimmed)
      if (taken) {
        setError('CALLSIGN TAKEN! PICK ANOTHER.')
        setLoading(false)
        return
      }
      await saveUsername(user.uid, trimmed)
      await reserveUsername(user.uid, trimmed)
      onDone(trimmed)
    } catch (e) {
      setError('SOMETHING WENT WRONG. TRY AGAIN.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20,
        padding: '40px 28px',
        width: '100%', maxWidth: 360,
        animation: 'fadeUp 0.5s ease',
      }}>
        {/* Google avatar */}
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="avatar"
            style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '3px solid #ff6b00',
              boxShadow: '0 0 20px rgba(255,107,0,0.4)',
            }}
          />
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem',
            color: '#ff6b00', letterSpacing: '0.1em',
            textShadow: '0 0 20px rgba(255,107,0,0.4)',
          }}>
            CHOOSE YOUR CALLSIGN
          </div>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 300,
            fontSize: '0.9rem', letterSpacing: '0.2em', color: '#6b5c4a',
            marginTop: 6,
          }}>
            THIS IS WHAT SHOWS ON THE LEADERBOARD
          </div>
        </div>

        <input
          type="text"
          value={username}
          onChange={e => { setUsername(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          placeholder="E.G. KINGKOBE"
          maxLength={14}
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(255,107,0,0.07)',
            border: `2px solid ${error ? '#ff4040' : 'rgba(255,107,0,0.3)'}`,
            borderRadius: 6,
            padding: '14px 20px',
            color: '#f0e6d3',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '1.1rem',
            letterSpacing: '0.15em',
            textAlign: 'center',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />

        {/* Character count */}
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.7rem', color: '#6b5c4a',
          alignSelf: 'flex-end', marginTop: -14,
        }}>
          {username.trim().length}/14
        </div>

        {error && (
          <div style={{
            color: '#ff4040',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.8rem', letterSpacing: '0.05em',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            width: '100%', background: loading ? 'rgba(255,107,0,0.4)' : '#ff6b00',
            border: 'none', borderRadius: 6,
            padding: '16px', fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.5rem', letterSpacing: '0.1em',
            color: '#0a0a0f', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 24px rgba(255,107,0,0.4)',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'CHECKING...' : 'LOCK IT IN 🏀'}
        </button>

        <div style={{
          fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem',
          color: '#4a3a2a', textAlign: 'center', lineHeight: 1.6,
        }}>
          LETTERS, NUMBERS & _ ONLY<br />
          YOU CAN'T CHANGE THIS LATER
        </div>
      </div>
    </div>
  )
}
