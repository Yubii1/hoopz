// src/pages/BattleResults.jsx
import { useState, useEffect } from 'react'
import { generateCode, requestRematch, acceptRematch, listenBattle } from '../firebase/battle'

export default function BattleResults({
  myName, myScore, opponentName, opponentScore,
  prevBattleCode, myRole,
  onRematch, onHome,
}) {
  const iWon = myScore > opponentScore
  const isTie = myScore === opponentScore

  // rematch states: idle | requesting | waiting | opponent-requested
  const [rematchState, setRematchState] = useState('idle')
  const [newCode, setNewCode] = useState(null)
  const [unsubRef, setUnsubRef] = useState(null)

  // Listen on old battle room for opponent rematch request
  useEffect(() => {
    if (!prevBattleCode) return
    const stop = listenBattle(prevBattleCode, (data) => {
      if (!data?.rematch) return
      const { requesterRole, newCode: oppNewCode } = data.rematch
      // Only react if opponent (not us) requested
      if (requesterRole !== myRole) {
        setRematchState('opponent-requested')
        setNewCode(oppNewCode)
      }
    })
    setUnsubRef(() => stop)
    return () => stop()
  }, [prevBattleCode, myRole])

  async function handleRequestRematch() {
    setRematchState('requesting')
    const code = generateCode()
    setNewCode(code)
    try {
      await requestRematch(prevBattleCode, code, myRole, myName)
      setRematchState('waiting')
    } catch (e) {
      setRematchState('idle')
    }
  }

  async function handleAcceptRematch() {
    if (!newCode) return
    setRematchState('requesting')
    try {
      await acceptRematch(newCode, myName)
      if (unsubRef) unsubRef()
      // Opponent is host, I'm guest
      onRematch({ code: newCode, role: 'guest', opponentName })
    } catch (e) {
      setRematchState('opponent-requested')
    }
  }

  function handleRematchAsHost() {
    if (unsubRef) unsubRef()
    // I requested so I'm host
    onRematch({ code: newCode, role: 'host', opponentName })
  }

  // When waiting and opponent joins our new room, auto-proceed
  useEffect(() => {
    if (rematchState !== 'waiting' || !newCode) return
    const stop = listenBattle(newCode, (data) => {
      if (data?.status === 'countdown' && data?.guest) {
        stop()
        handleRematchAsHost()
      }
    })
    return () => stop()
  }, [rematchState, newCode])

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
          linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '32px 24px',
        width: '100%', maxWidth: 380,
      }}>
        {/* Result label */}
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 'clamp(56px, 18vw, 80px)',
          lineHeight: 0.9,
          color: isTie ? '#ff6b00' : iWon ? '#00ff87' : '#ff4040',
          textShadow: isTie
            ? '0 0 30px rgba(255,107,0,0.5)'
            : iWon
            ? '0 0 30px rgba(0,255,135,0.5)'
            : '0 0 30px rgba(255,64,64,0.5)',
          letterSpacing: '0.04em', marginBottom: 6,
        }}>
          {isTie ? "IT'S A TIE!" : iWon ? 'YOU WIN! 🏆' : 'YOU LOSE 💀'}
        </div>

        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.72rem', color: '#6b5c4a',
          letterSpacing: '0.3em', marginBottom: 24,
        }}>
          BATTLE COMPLETE
        </div>

        {/* Score cards */}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 24 }}>
          <ScoreCard name={myName} score={myScore} winner={iWon || isTie} label="YOU" />
          <div style={{
            display: 'flex', alignItems: 'center',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.4rem', color: '#4a3a2a', flexShrink: 0,
          }}>VS</div>
          <ScoreCard name={opponentName ?? 'OPPONENT'} score={opponentScore} winner={!iWon || isTie} label="THEM" />
        </div>

        {/* ── Rematch section ── */}
        <div style={{ width: '100%', marginBottom: 10 }}>

          {/* Opponent requested a rematch — banner */}
          {rematchState === 'opponent-requested' && (
            <div style={{
              background: 'rgba(0,255,135,0.06)',
              border: '1px solid rgba(0,255,135,0.3)',
              borderRadius: 8, padding: '12px 16px',
              marginBottom: 10, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '0.72rem', color: '#00ff87',
                letterSpacing: '0.15em', marginBottom: 8,
              }}>
                🔥 {opponentName} WANTS A REMATCH!
              </div>
              <button onClick={handleAcceptRematch} style={btnGreen}>
                ACCEPT REMATCH
              </button>
            </div>
          )}

          {/* Waiting for opponent to accept */}
          {rematchState === 'waiting' && (
            <div style={{
              background: 'rgba(255,107,0,0.06)',
              border: '1px solid rgba(255,107,0,0.25)',
              borderRadius: 8, padding: '12px 16px',
              marginBottom: 10, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '0.65rem', color: '#6b5c4a',
                letterSpacing: '0.15em', marginBottom: 6,
              }}>
                REMATCH REQUESTED
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '0.72rem', color: '#ff6b00',
                letterSpacing: '0.1em',
              }}>
                <span style={{
                  display: 'inline-block', width: 8, height: 8,
                  borderRadius: '50%', background: '#00ff87',
                  boxShadow: '0 0 8px #00ff87',
                  animation: 'pulse 1.2s ease-in-out infinite',
                }} />
                WAITING FOR {opponentName?.toUpperCase() ?? 'OPPONENT'}...
              </div>
            </div>
          )}

          {/* Idle / requesting state — show rematch button */}
          {(rematchState === 'idle' || rematchState === 'requesting') && (
            <button
              onClick={handleRequestRematch}
              disabled={rematchState === 'requesting'}
              style={{ ...btnMain, opacity: rematchState === 'requesting' ? 0.5 : 1 }}
            >
              {rematchState === 'requesting' ? 'SETTING UP...' : '⚡ DEMAND REMATCH'}
            </button>
          )}
        </div>

        <button onClick={onHome} style={btnGhost}>← HOME</button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}

function ScoreCard({ name, score, winner, label }) {
  return (
    <div style={{
      flex: 1,
      background: winner ? 'rgba(0,255,135,0.04)' : 'rgba(255,64,64,0.04)',
      border: `2px solid ${winner ? 'rgba(0,255,135,0.25)' : 'rgba(255,64,64,0.2)'}`,
      borderRadius: 10, padding: '14px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#4a3a2a', letterSpacing: '0.2em' }}>{label}</div>
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.9rem', color: '#ff6b00',
        letterSpacing: '0.06em', lineHeight: 1,
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</div>
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', lineHeight: 1,
        color: winner ? '#00ff87' : '#ff4040',
        textShadow: winner ? '0 0 16px rgba(0,255,135,0.4)' : '0 0 16px rgba(255,64,64,0.4)',
      }}>{score}</div>
    </div>
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
const btnGreen = {
  width: '100%', background: 'transparent',
  border: '2px solid rgba(0,255,135,0.5)', borderRadius: 6,
  padding: '12px', fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.3rem', letterSpacing: '0.1em', color: '#00ff87', cursor: 'pointer',
}
