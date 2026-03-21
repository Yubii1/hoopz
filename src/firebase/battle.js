// src/firebase/battle.js
import { getDatabase, ref, set, get, update, onValue, off, push, serverTimestamp } from 'firebase/database'
import { app } from './config'

const db = getDatabase(app)

function roomRef(code) { return ref(db, `battles/${code}`) }

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

export async function markDone(code, role, score) {
  await update(ref(db, `battles/${code}/${role}`), { score, done: true })
  const snap = await get(roomRef(code))
  const data = snap.val()
  if (data?.host?.done && data?.guest?.done) {
    await update(roomRef(code), { status: 'finished' })
    // Save to history for both players
    await saveBattleHistory(data)
  }
}

export async function markDisconnected(code, disconnectedRole) {
  await update(roomRef(code), {
    [`${disconnectedRole}/disconnected`]: true,
    status: 'finished',
  })
  const snap = await get(roomRef(code))
  const data = snap.val()
  if (data) await saveBattleHistory(data, disconnectedRole)
}

async function saveBattleHistory(data, disconnectedRole = null) {
  const host = data.host
  const guest = data.guest
  if (!host || !guest) return

  const hostWon = disconnectedRole === 'guest'
    ? true
    : disconnectedRole === 'host'
    ? false
    : host.score > guest.score

  const record = {
    hostName: host.name,
    guestName: guest.name,
    hostScore: host.score ?? 0,
    guestScore: guest.score ?? 0,
    hostWon,
    disconnected: disconnectedRole,
    playedAt: serverTimestamp(),
  }

  // Save under each player's history
  const hostHistRef = ref(db, `battleHistory/${sanitize(host.name)}`)
  const guestHistRef = ref(db, `battleHistory/${sanitize(guest.name)}`)
  await push(hostHistRef, record)
  await push(guestHistRef, record)
}

function sanitize(name) {
  return name?.toLowerCase().replace(/[^a-z0-9]/g, '_') ?? 'unknown'
}

export async function getBattleHistory(playerName, limit = 10) {
  const { query, orderByChild, limitToLast } = await import('firebase/database')
  const r = ref(db, `battleHistory/${sanitize(playerName)}`)
  const q = query(r, orderByChild('playedAt'), limitToLast(limit))
  const snap = await get(q)
  if (!snap.exists()) return []
  const entries = []
  snap.forEach(child => entries.push({ id: child.key, ...child.val() }))
  return entries.reverse()
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
