// src/pages/BattleLobby.jsx
import { useState, useEffect } from 'react'
import { createBattle, joinBattle, generateCode, listenBattle, deleteBattle, getBattleHistory } from '../firebase/battle'
import LoadingScreen from '../components/LoadingScreen'

export default function BattleLobby({ playerName, onBattleStart, onBack }) {
  const [mode, setMode] = useState('menu')
  const [code, setCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [unsub, setUnsub] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    getBattleHistory(playerName)
      .then(data => { setHistory(data); setHistoryLoading(false) })
      .catch(() => setHistoryLoading(false))
  }, [playerName])

  async function handleCreate() {
    setLoading(true)
    setLoadingMessage('CREATING ROOM...')
    setError('')
    const newCode = generateCode()
    try {
      await createBattle(newCode, playerName)
      setCode(newCode)
      setMode('create')
      setStatus('WAITING FOR OPPONENT...')
      setLoading(false)
      const stop = listenBattle(newCode, (data) => {
        if (!data) return
        if (data.status === 'countdown' && data.guest) {
          stop()
          onBattleStart({ code: newCode, role: 'host', opponentName: data.guest.name })
        }
      })
      setUnsub(() => stop)
    } catch (e) {
      setError('FAILED TO CREATE ROOM. TRY AGAIN.')
      setLoading(false)
    }
  }

  async function handleJoin() {
    const trimmed = inputCode.trim()
    if (trimmed.length !== 4) { setError('ENTER A VALID 4-DIGIT CODE'); return }
    setLoading(true)
    setLoadingMessage('JOINING ROOM...')
    setError('')
    try {
      await joinBattle(trimmed, playerName)
      onBattleStart({ code: trimmed, role: 'guest', opponentName: null })
    } catch (e) {
      setError(e.message || 'COULD NOT JOIN ROOM.')
      setLoading(false)
    }
  }

  function handleCancel() {
    if (unsub) unsub()
    if (code) deleteBattle(code).catch(() => {})
    setMode('menu')
    setCode('')
    setStatus('')
    setError('')
  }

  if (loading) return <LoadingScreen message={loadingMessage} />

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      background: '#0a0a0f', overflow: 'hidden auto',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 48px', width: '100%', maxWidth: 380 }}>

        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(42px, 13vw, 64px)', color: '#ff6b00', textShadow: '0 0 30px rgba(255,107,0,0.4), 3px 3px 0 #3d1a00', letterSpacing: '0.06em', lineHeight: 1, marginBottom: 4 }}>FRIEND BATTLE</div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.75rem', color: '#6b5c4a', letterSpacing: '0.35em', marginBottom: 28 }}>REAL-TIME 1V1</div>

        {/* MENU */}
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <button onClick={handleCreate} style={btnMain}>⚡ CREATE ROOM</button>
            <button onClick={() => { setMode('join'); setError('') }} style={btnGhost}>🔗 JOIN WITH CODE</button>
            <button onClick={onBack} style={{ ...btnGhost, borderColor: 'rgba(255,107,0,0.12)', color: '#4a3a2a', marginTop: 4 }}>← BACK</button>
          </div>
        )}

        {/* WAITING */}
        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem', color: '#6b5c4a', letterSpacing: '0.2em', textAlign: 'center' }}>SHARE THIS CODE WITH YOUR OPPONENT</div>
            <div style={{ background: 'rgba(255,107,0,0.06)', border: '2px solid rgba(255,107,0,0.35)', borderRadius: 12, padding: '18px 32px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(64px, 20vw, 88px)', color: '#ff6b00', textShadow: '0 0 24px rgba(255,107,0,0.5)', letterSpacing: '0.2em', lineHeight: 1 }}>{code}</div>
            </div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.75rem', color: '#6b5c4a', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00ff87', boxShadow: '0 0 8px #00ff87', animation: 'pulse 1.2s ease-in-out infinite' }} />
              {status}
            </div>
            <button onClick={handleCancel} style={{ ...btnGhost, borderColor: 'rgba(255,107,0,0.15)', color: '#4a3a2a', width: '100%' }}>CANCEL</button>
          </div>
        )}

        {/* JOIN */}
        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem', color: '#6b5c4a', letterSpacing: '0.2em', marginBottom: 4 }}>ENTER ROOM CODE</div>
            <input type="text" inputMode="numeric" placeholder="0000" maxLength={4} value={inputCode} onChange={e => { setInputCode(e.target.value.replace(/\D/g, '')); setError('') }} onKeyDown={e => e.key === 'Enter' && handleJoin()} style={{ ...inputStyle, fontSize: '2.8rem', textAlign: 'center', letterSpacing: '0.5em', padding: '16px', fontFamily: 'Bebas Neue, sans-serif' }} />
            {error && <div style={{ color: '#ff4040', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem', textAlign: 'center' }}>⚠️ {error}</div>}
            <button onClick={handleJoin} disabled={inputCode.length !== 4} style={{ ...btnMain, opacity: inputCode.length !== 4 ? 0.4 : 1 }}>JOIN BATTLE</button>
            <button onClick={() => { setMode('menu'); setError(''); setInputCode('') }} style={btnGhost}>← BACK</button>
          </div>
        )}

        {/* ── Battle History ── */}
        {mode === 'menu' && (
          <div style={{ width: '100%', marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.12)' }} />
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: '#4a3a2a', letterSpacing: '0.25em' }}>BATTLE HISTORY</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.12)' }} />
            </div>

            {historyLoading && (
              <div style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#4a3a2a', padding: '16px', letterSpacing: '0.1em' }}>LOADING...</div>
            )}

            {!historyLoading && history.length === 0 && (
              <div style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#4a3a2a', padding: '16px', letterSpacing: '0.1em' }}>NO BATTLES YET. CREATE A ROOM!</div>
            )}

            {!historyLoading && history.map((h, i) => {
              const iAmHost = h.hostName?.toLowerCase() === playerName?.toLowerCase()
              const myScore = iAmHost ? h.hostScore : h.guestScore
              const theirScore = iAmHost ? h.guestScore : h.hostScore
              const theirName = iAmHost ? h.guestName : h.hostName
              const iWon = iAmHost ? h.hostWon : !h.hostWon
              const wasDisconnect = h.disconnected != null
              return (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#16130e',
                  border: `1px solid ${iWon ? 'rgba(0,255,135,0.15)' : 'rgba(255,64,64,0.12)'}`,
                  borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                  animation: 'fadeUp 0.3s ease both',
                  animationDelay: `${i * 0.05}s`,
                }}>
                  {/* Result badge */}
                  <div style={{
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem',
                    color: iWon ? '#00ff87' : '#ff4040',
                    minWidth: 32, textAlign: 'center',
                    textShadow: iWon ? '0 0 8px rgba(0,255,135,0.4)' : '0 0 8px rgba(255,64,64,0.4)',
                  }}>
                    {iWon ? 'WIN' : 'L'}
                  </div>
                  {/* Opponent */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#f0e6d3', letterSpacing: '0.04em' }}>
                      vs {theirName}
                      {wasDisconnect && <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.55rem', color: '#6b5c4a', marginLeft: 6 }}>DISCONNECT</span>}
                    </div>
                  </div>
                  {/* Scores */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#ff6b00', letterSpacing: '0.04em' }}>
                      {myScore} <span style={{ color: '#4a3a2a', fontSize: '0.8rem' }}>–</span> {theirScore}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

const btnMain = { width: '100%', background: '#ff6b00', border: 'none', borderRadius: 6, padding: '15px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', letterSpacing: '0.1em', color: '#0a0a0f', cursor: 'pointer', boxShadow: '0 4px 24px rgba(255,107,0,0.4), 0 2px 0 #3d1a00' }
const btnGhost = { width: '100%', background: 'transparent', border: '2px solid rgba(255,107,0,0.3)', borderRadius: 6, padding: '13px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.1em', color: '#ff6b00', cursor: 'pointer' }
const inputStyle = { width: '100%', background: 'rgba(255,107,0,0.07)', border: '2px solid rgba(255,107,0,0.3)', borderRadius: 6, padding: '13px 16px', color: '#f0e6d3', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.9rem', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box' }
