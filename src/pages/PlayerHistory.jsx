// src/pages/PlayerHistory.jsx
import { useState, useEffect } from 'react'
import { db as firestoreDb } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { getBattleHistory } from '../firebase/battle'

// ── Firestore solo stats ───────────────────────────────────────────────────────
async function getSoloStats(playerName) {
  const id = playerName.toLowerCase().replace(/\s+/g, '_')
  const snap = await getDoc(doc(firestoreDb, 'players', id))
  if (!snap.exists()) return null
  return snap.data()
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return n?.toLocaleString() ?? '0' }
function pct(made, taken) {
  if (!taken) return '0%'
  return Math.round((made / taken) * 100) + '%'
}
function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

// ── Battle Detail Modal ────────────────────────────────────────────────────────
function BattleDetailModal({ battle, playerName, onClose }) {
  const iAmHost = battle.hostName?.toLowerCase() === playerName?.toLowerCase()
  const myScore = iAmHost ? battle.hostScore : battle.guestScore
  const theirScore = iAmHost ? battle.guestScore : battle.hostScore
  const theirName = iAmHost ? battle.guestName : battle.hostName
  const iWon = iAmHost ? battle.hostWon : !battle.hostWon
  const scoreDiff = myScore - theirScore
  const wasDisconnect = battle.disconnected != null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440,
        background: '#13110c',
        border: `2px solid ${iWon ? 'rgba(0,255,135,0.25)' : 'rgba(255,64,64,0.2)'}`,
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 40px',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,107,0,0.2)', margin: '0 auto 24px' }} />

        {/* Result header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '3.5rem',
            color: iWon ? '#00ff87' : '#ff4040',
            textShadow: iWon ? '0 0 30px rgba(0,255,135,0.5)' : '0 0 30px rgba(255,64,64,0.5)',
            lineHeight: 1,
          }}>{iWon ? 'VICTORY' : 'DEFEAT'}</div>
          {wasDisconnect && (
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: '#6b5c4a', letterSpacing: '0.2em', marginTop: 4 }}>
              BY DISCONNECT
            </div>
          )}
        </div>

        {/* Score breakdown */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 20, marginBottom: 28,
          background: 'rgba(255,107,0,0.05)',
          border: '1px solid rgba(255,107,0,0.12)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: '#6b5c4a', letterSpacing: '0.2em', marginBottom: 6 }}>YOU</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: '#ff6b00', lineHeight: 1 }}>{fmt(myScore)}</div>
          </div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#3a2a1a' }}>VS</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: '#6b5c4a', letterSpacing: '0.2em', marginBottom: 6 }}>{theirName}</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: '#f0e6d3', lineHeight: 1 }}>{fmt(theirScore)}</div>
          </div>
        </div>

        {/* Analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'MARGIN', value: (scoreDiff > 0 ? '+' : '') + fmt(scoreDiff) },
            { label: 'PLAYED', value: timeAgo(battle.playedAtMs || battle.playedAt) },
            { label: 'RESULT', value: iWon ? 'WIN 🏆' : 'LOSS' },
            { label: 'ROLE', value: iAmHost ? 'HOST' : 'GUEST' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,107,0,0.04)',
              border: '1px solid rgba(255,107,0,0.1)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#4a3a2a', letterSpacing: '0.2em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#f0e6d3', letterSpacing: '0.05em' }}>{value}</div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          width: '100%', background: 'rgba(255,107,0,0.1)',
          border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8,
          padding: '14px', fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.2rem', letterSpacing: '0.1em', color: '#ff6b00', cursor: 'pointer',
        }}>CLOSE</button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PlayerHistory({ playerName, onBack }) {
  const [soloStats, setSoloStats] = useState(null)
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBattle, setSelectedBattle] = useState(null)
  const [tab, setTab] = useState('all') // 'all' | 'battles'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [stats, hist] = await Promise.all([
          getSoloStats(playerName),
          getBattleHistory(playerName, 20),
        ])
        setSoloStats(stats)
        setBattles(hist)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [playerName])

  // Battle win/loss
  const wins = battles.filter(b => {
    const iAmHost = b.hostName?.toLowerCase() === playerName?.toLowerCase()
    return iAmHost ? b.hostWon : !b.hostWon
  }).length
  const losses = battles.length - wins
  const winRate = battles.length ? Math.round((wins / battles.length) * 100) : 0

  const avgBattleScore = battles.length
    ? Math.round(battles.reduce((sum, b) => {
        const iAmHost = b.hostName?.toLowerCase() === playerName?.toLowerCase()
        return sum + (iAmHost ? b.hostScore : b.guestScore)
      }, 0) / battles.length)
    : 0

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden auto',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 60px', maxWidth: 440, width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Share Tech Mono, monospace', fontSize: '0.75rem',
            color: '#4a3a2a', letterSpacing: '0.15em', padding: '8px 0',
          }}>← BACK</button>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 11vw, 52px)', color: '#ff6b00', textShadow: '0 0 30px rgba(255,107,0,0.3)', letterSpacing: '0.06em', lineHeight: 1 }}>
            MY STATS
          </div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#4a3a2a', letterSpacing: '0.3em', marginTop: 2 }}>
            {playerName?.toUpperCase()}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.75rem', color: '#4a3a2a', letterSpacing: '0.2em' }}>
            LOADING...
          </div>
        ) : (
          <>
            {/* ── Solo Stats Card ── */}
            <div style={{ margin: '0 16px 16px' }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: '#4a3a2a', letterSpacing: '0.25em', marginBottom: 10, paddingLeft: 4 }}>SOLO PERFORMANCE</div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,107,0,0.08) 0%, rgba(255,107,0,0.03) 100%)',
                border: '1px solid rgba(255,107,0,0.18)',
                borderRadius: 14, padding: '20px 18px',
              }}>
                {soloStats ? (
                  <>
                    {/* Best score big */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 18 }}>
                      <div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#6b5c4a', letterSpacing: '0.2em', marginBottom: 4 }}>BEST SCORE</div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '4rem', color: '#ff6b00', lineHeight: 1, textShadow: '0 0 20px rgba(255,107,0,0.4)' }}>
                          {fmt(soloStats.bestScore)}
                        </div>
                      </div>
                      <div style={{ paddingBottom: 8 }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#6b5c4a', letterSpacing: '0.2em', marginBottom: 4 }}>GAMES</div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#f0e6d3', lineHeight: 1 }}>{fmt(soloStats.gamesPlayed)}</div>
                      </div>
                    </div>
                    {/* Shot stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'SHOTS MADE', value: fmt(soloStats.totalMade) },
                        { label: 'SHOTS TAKEN', value: fmt(soloStats.totalShots) },
                        { label: 'ACCURACY', value: pct(soloStats.totalMade, soloStats.totalShots) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 10px' }}>
                          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.52rem', color: '#4a3a2a', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#f0e6d3' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#4a3a2a', letterSpacing: '0.1em', textAlign: 'center', padding: '12px 0' }}>
                    NO SOLO GAMES YET. HIT THE COURT!
                  </div>
                )}
              </div>
            </div>

            {/* ── Battle Stats Card ── */}
            {battles.length > 0 && (
              <div style={{ margin: '0 16px 20px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: '#4a3a2a', letterSpacing: '0.25em', marginBottom: 10, paddingLeft: 4 }}>FRIEND BATTLE RECORD</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,107,0,0.12)',
                  borderRadius: 14, padding: '18px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}>
                  {[
                    { label: 'WIN RATE', value: winRate + '%', color: winRate >= 50 ? '#00ff87' : '#ff4040' },
                    { label: 'AVG SCORE', value: fmt(avgBattleScore), color: '#ff6b00' },
                    { label: 'WINS', value: wins, color: '#00ff87' },
                    { label: 'LOSSES', value: losses, color: '#ff4040' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.08)', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: '#4a3a2a', letterSpacing: '0.18em', marginBottom: 5 }}>{label}</div>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color, lineHeight: 1, textShadow: `0 0 12px ${color}55` }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 0, margin: '0 16px 14px', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, overflow: 'hidden' }}>
              {[['all', 'ALL GAMES'], ['battles', 'BATTLES ONLY']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, padding: '10px',
                  background: tab === key ? '#ff6b00' : 'transparent',
                  color: tab === key ? '#0a0a0f' : '#6b5c4a',
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem',
                  letterSpacing: '0.08em', border: 'none', cursor: 'pointer',
                  borderRight: key === 'all' ? '1px solid rgba(255,107,0,0.2)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* ── Game List ── */}
            <div style={{ padding: '0 16px' }}>

              {/* Solo games — shown in 'all' tab only */}
              {tab === 'all' && soloStats && (
                <div style={{
                  background: '#16130e',
                  border: '1px solid rgba(255,107,0,0.1)',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ fontSize: '1.2rem' }}>🏀</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#f0e6d3', letterSpacing: '0.04em' }}>SOLO GAMES</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#6b5c4a', letterSpacing: '0.1em', marginTop: 2 }}>
                      {fmt(soloStats.gamesPlayed)} GAMES · {pct(soloStats.totalMade, soloStats.totalShots)} ACCURACY
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.55rem', color: '#4a3a2a', letterSpacing: '0.1em' }}>BEST</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: '#ff6b00' }}>{fmt(soloStats.bestScore)}</div>
                  </div>
                </div>
              )}

              {/* Battle entries */}
              {battles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: '#4a3a2a', letterSpacing: '0.15em' }}>
                  NO BATTLES YET. CHALLENGE A FRIEND!
                </div>
              )}

              {battles.map((b, i) => {
                const iAmHost = b.hostName?.toLowerCase() === playerName?.toLowerCase()
                const myScore = iAmHost ? b.hostScore : b.guestScore
                const theirScore = iAmHost ? b.guestScore : b.hostScore
                const theirName = iAmHost ? b.guestName : b.hostName
                const iWon = iAmHost ? b.hostWon : !b.hostWon
                const wasDisconnect = b.disconnected != null

                return (
                  <div key={b.id} onClick={() => setSelectedBattle(b)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: '#16130e',
                      border: `1px solid ${iWon ? 'rgba(0,255,135,0.12)' : 'rgba(255,64,64,0.1)'}`,
                      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                      cursor: 'pointer',
                      animation: 'fadeUp 0.3s ease both',
                      animationDelay: `${i * 0.04}s`,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1c180f'}
                    onMouseLeave={e => e.currentTarget.style.background = '#16130e'}
                  >
                    {/* Win/Loss badge */}
                    <div style={{
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.9rem',
                      color: iWon ? '#00ff87' : '#ff4040',
                      minWidth: 28, textAlign: 'center',
                      textShadow: iWon ? '0 0 8px rgba(0,255,135,0.5)' : '0 0 8px rgba(255,64,64,0.4)',
                    }}>
                      {iWon ? 'W' : 'L'}
                    </div>

                    {/* Opponent + time */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.92rem', color: '#f0e6d3', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        vs {theirName}
                        {wasDisconnect && <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.5rem', color: '#4a3a2a', letterSpacing: '0.1em' }}>DC</span>}
                      </div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: '#4a3a2a', letterSpacing: '0.08em', marginTop: 2 }}>
                        {timeAgo(b.playedAtMs || b.playedAt)} · TAP FOR DETAILS
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', color: '#ff6b00', letterSpacing: '0.04em', lineHeight: 1 }}>
                        {myScore} <span style={{ color: '#2a1f14', fontSize: '0.75rem' }}>–</span> {theirScore}
                      </div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.52rem', color: '#4a3a2a', marginTop: 2 }}>
                        {myScore > theirScore ? `+${myScore - theirScore}` : myScore < theirScore ? `-${theirScore - myScore}` : 'DRAW'}
                      </div>
                    </div>

                    <div style={{ color: '#2a1f14', fontSize: '0.7rem' }}>›</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Battle detail modal */}
      {selectedBattle && (
        <BattleDetailModal
          battle={selectedBattle}
          playerName={playerName}
          onClose={() => setSelectedBattle(null)}
        />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}
