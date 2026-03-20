// src/App.jsx
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import { getUsername } from './firebase/authHelpers'

import Landing from './pages/Landing'
import UsernameSetup from './pages/UsernameSetup'
import Game from './pages/Game'
import Results from './pages/Results'
import Leaderboard from './pages/Leaderboard'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [gameResult, setGameResult] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const saved = await getUsername(firebaseUser.uid)
        if (saved) {
          setUsername(saved)
          setScreen('landing')
        } else {
          setScreen('username-setup')
        }
      } else {
        setUser(null)
        setUsername('')
        setScreen('landing')
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  if (!authReady) return <Splash />

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {screen === 'landing' && (
        <Landing
          user={user}
          username={username}
          onPlay={() => setScreen('game')}
          onLeaderboard={() => setScreen('leaderboard')}
          onSignedIn={(firebaseUser) => {
            setUser(firebaseUser)
            setScreen('username-setup')
          }}
        />
      )}
      {screen === 'username-setup' && (
        <UsernameSetup
          user={user}
          onDone={(name) => {
            setUsername(name)
            setScreen('game')
          }}
        />
      )}
      {screen === 'game' && (
        <Game
          user={user}
          playerName={username}
          onEnd={(result) => { setGameResult(result); setScreen('results') }}
        />
      )}
      {screen === 'results' && (
        <Results
          result={gameResult}
          playerName={username}
          onPlayAgain={() => setScreen('game')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard
          playerName={username}
          onBack={() => setScreen('landing')}
          onPlay={() => setScreen(user ? 'game' : 'landing')}
        />
      )}
    </div>
  )
}

function Splash() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f',
    }}>
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 'clamp(72px, 22vw, 110px)',
        color: '#ff6b00',
        textShadow: '0 0 40px rgba(255,107,0,0.5)',
        animation: 'fadeDown 0.5s ease',
      }}>
        HOOPZ
      </div>
    </div>
  )
}
