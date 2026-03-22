// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import { getUsername } from './firebase/authHelpers'
import { listenBattle } from './firebase/battle'
import PlayerHistory from './pages/PlayerHistory'
import Landing from './pages/Landing'
import UsernameSetup from './pages/UsernameSetup'
import Game from './pages/Game'
import Results from './pages/Results'
import Leaderboard from './pages/Leaderboard'
import BattleLobby from './pages/BattleLobby'
import BattleResults from './pages/BattleResults'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [gameResult, setGameResult] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Battle state
  const [battleCode, setBattleCode] = useState(null)
  const [battleRole, setBattleRole] = useState(null)
  const [opponentName, setOpponentName] = useState(null)
  const [opponentScore, setOpponentScore] = useState(0)
  const [battleFinalData, setBattleFinalData] = useState(null)
  const [justFinishedBattle, setJustFinishedBattle] = useState(false)
  const battleUnsubRef = useRef(null)

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

  useEffect(() => {
    return () => { if (battleUnsubRef.current) battleUnsubRef.current() }
  }, [])

  function startBattle({ code, role, opponentName: oppName }) {
    setBattleCode(code)
    setBattleRole(role)
    setOpponentName(oppName)
    setOpponentScore(0)

    if (battleUnsubRef.current) battleUnsubRef.current()
    const stop = listenBattle(code, (data) => {
      if (!data) return
      const oppRole = role === 'host' ? 'guest' : 'host'
      const opp = data[oppRole]
      if (opp) {
        if (!oppName && opp.name) setOpponentName(opp.name)
        setOpponentScore(opp.score ?? 0)
      }
      if (data.status === 'finished') {
        stop()
        const myData = data[role]
        const theirData = data[oppRole]
        setBattleFinalData({
          myScore: myData?.score ?? 0,
          opponentScore: theirData?.score ?? 0,
          opponentName: theirData?.name ?? 'OPPONENT',
          prevBattleCode: code,
          myRole: role,
        })
        setScreen('battle-results')
      }
    })
    battleUnsubRef.current = stop
    setScreen('game-battle')
  }

  function resetBattle() {
    if (battleUnsubRef.current) battleUnsubRef.current()
    battleUnsubRef.current = null
    setBattleCode(null)
    setBattleRole(null)
    setOpponentName(null)
    setOpponentScore(0)
    setBattleFinalData(null)
  }

  if (!authReady) return <Splash />

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {screen === 'landing' && (
        <Landing
          user={user}
          username={username}
          onPlay={() => setScreen('game')}
           onHistory={() => setScreen('history')}
          onLeaderboard={() => setScreen('leaderboard')}
          onBattle={() => setScreen('battle-lobby')}
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
      {screen === 'game-battle' && (
        <Game
          user={user}
          playerName={username}
          battleCode={battleCode}
          battleRole={battleRole}
          opponentName={opponentName}
          opponentScore={opponentScore}
          onEnd={(result) => {
            setGameResult(result)
            setTimeout(() => {
              setScreen(prev => prev === 'game-battle' ? 'battle-results' : prev)
            }, 5000)
          }}
        />
      )}
      {screen === 'history' && (
  <PlayerHistory
    playerName={username}
    onBack={() => setScreen('landing')}
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
      {screen === 'battle-results' && battleFinalData && (
        <BattleResults
          myName={username}
          myScore={battleFinalData.myScore}
          opponentName={battleFinalData.opponentName}
          opponentScore={battleFinalData.opponentScore}
          prevBattleCode={battleFinalData.prevBattleCode}
          myRole={battleFinalData.myRole}
          onRematch={(battleParams) => {
            resetBattle()
            startBattle(battleParams)
          }}
          onHome={() => {
            resetBattle()
            setJustFinishedBattle(true)   // ← add this line
            setScreen('battle-lobby')
          }}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard
          playerName={username}
          onBack={() => setScreen('landing')}
          onPlay={() => setScreen(user ? 'game' : 'landing')}
        />
      )}
      {screen === 'battle-lobby' && (
        <BattleLobby
          playerName={username}
          onBattleStart={startBattle}
          onBack={() => setScreen('landing')}
          justFinishedBattle={justFinishedBattle}
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
