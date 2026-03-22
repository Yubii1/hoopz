// src/firebase/battle.js
import {
  getDatabase, ref, set, get, update, onValue, off,
  push, query, orderByChild, limitToLast, serverTimestamp
} from 'firebase/database'
import { app } from './config'

const db = getDatabase(app)

function roomRef(code) { return ref(db, `battles/${code}`) }

function sanitize(name) {
  return name?.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') ?? 'unknown'
}

// ─── Core battle actions ──────────────────────────────────────────────────────

export async function createBattle(code, hostName) {
  await set(roomRef(code), {
    host: { name: hostName, score: 0, ready: false, done: false },
    guest: null,
    status: 'waiting',
    createdAt: serverTimestamp(),
  })
}

export async function joinBattle(code, guestName) {
  const snap = await get(roomRef(code))
  if (!snap.exists()) throw new Error('ROOM NOT FOUND')
  const data = snap.val()
  if (data.status !== 'waiting') throw new Error('GAME ALREADY STARTED')
  if (data.guest) throw new Error('ROOM IS FULL')
  await update(roomRef(code), {
    guest: { name: guestName, score: 0, ready: false, done: false },
    status: 'countdown',
  })
}

export function listenBattle(code, cb) {
  const r = roomRef(code)
  onValue(r, snap => cb(snap.val()))
  return () => off(r)
}

export async function updateScore(code, role, score) {
  await update(ref(db, `battles/${code}/${role}`), { score })
}

export async function deleteBattle(code) {
  await set(roomRef(code), null)
}

export async function requestRematch(oldCode, newCode, requesterRole, requesterName) {
  await update(roomRef(oldCode), {
    rematch: { newCode, requesterRole, requesterName },
  })
  await createBattle(newCode, requesterName)
}

export async function acceptRematch(newCode, joinerName) {
  await joinBattle(newCode, joinerName)
}

export function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// ─── Unified history writer ───────────────────────────────────────────────────
// All saves go through here. Uses push() for auto-keys and a numeric
// `playedAtMs` field so orderByChild works reliably.

async function writeHistoryForBoth({ hostName, guestName, hostScore, guestScore, hostWon, disconnected = null }) {
  const hostKey  = sanitize(hostName)
  const guestKey = sanitize(guestName)

  const record = {
    hostName,
    guestName,
    hostScore,
    guestScore,
    hostWon,
    // Store as a plain ms timestamp — serverTimestamp() inside multi-path
    // update() is unreliable for ordering; this is always correct.
    playedAtMs: Date.now(),
    ...(disconnected ? { disconnected } : {}),
  }

  // push() gives each entry a unique Firebase key under each player's node
  await Promise.all([
    push(ref(db, `battleHistory/${hostKey}`), record),
    push(ref(db, `battleHistory/${guestKey}`), record),
  ])
}

// ─── markDone: called when a player finishes normally ────────────────────────

export async function markDone(battleCode, role, score) {
  const battleRef = ref(db, `battles/${battleCode}`)

  await update(battleRef, {
    [`${role}Done`]:  true,
    [`${role}Score`]: score,
  })

  const snap = await get(battleRef)
  if (!snap.exists()) return
  const data = snap.val()

  if (data.hostDone && data.guestDone) {
    const hostWon = (data.hostScore ?? 0) >= (data.guestScore ?? 0)
    await writeHistoryForBoth({
      hostName:  data.host.name,
      guestName: data.guest.name,
      hostScore: data.hostScore ?? 0,
      guestScore: data.guestScore ?? 0,
      hostWon,
    })
  }
}

// ─── markDisconnected: called when a player drops ────────────────────────────

export async function markDisconnected(code, disconnectedRole) {
  await update(roomRef(code), {
    [`${disconnectedRole}/disconnected`]: true,
    status: 'finished',
  })

  const snap = await get(roomRef(code))
  if (!snap.exists()) return
  const data = snap.val()

  const host  = data.host
  const guest = data.guest
  if (!host || !guest) return

  const hostWon = disconnectedRole === 'guest'

  await writeHistoryForBoth({
    hostName:  host.name,
    guestName: guest.name,
    // Use whichever score field is present (nested or flat)
    hostScore:  data.hostScore  ?? host.score  ?? 0,
    guestScore: data.guestScore ?? guest.score ?? 0,
    hostWon,
    disconnected: disconnectedRole,
  })
}

// ─── getBattleHistory ─────────────────────────────────────────────────────────

export async function getBattleHistory(playerName, limit = 10) {
  if (!playerName) return []

  const safeName = sanitize(playerName)
  const r = ref(db, `battleHistory/${safeName}`)

  // Order by our reliable numeric timestamp field
  const q = query(r, orderByChild('playedAtMs'), limitToLast(limit))

  try {
    const snap = await get(q)
    if (!snap.exists()) return []

    const entries = []
    snap.forEach(child => {
      entries.push({ id: child.key, ...child.val() })
    })

    return entries.reverse() // newest first
  } catch (e) {
    console.error('History fetch error:', e)
    return []
  }
}