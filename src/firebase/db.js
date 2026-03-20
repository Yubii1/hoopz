// src/firebase/db.js
import { db } from './config'
import {
  collection, doc, getDoc, setDoc, updateDoc,
  getDocs, query, orderBy, limit, increment,
} from 'firebase/firestore'

const PLAYERS = 'players'

export async function saveScore(name, score, made, taken) {
  const id = name.toLowerCase().replace(/\s+/g, '_')
  const ref = doc(db, PLAYERS, id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data()
    await updateDoc(ref, {
      bestScore: Math.max(data.bestScore || 0, score),
      gamesPlayed: increment(1),
      totalShots: increment(taken),
      totalMade: increment(made),
    })
  } else {
    await setDoc(ref, {
      name,
      bestScore: score,
      gamesPlayed: 1,
      totalShots: taken,
      totalMade: made,
      createdAt: new Date(),
    })
  }

  // Return current rank
  const q = query(collection(db, PLAYERS), orderBy('bestScore', 'desc'))
  const all = await getDocs(q)
  let rank = 1
  for (const d of all.docs) {
    if (d.id === id) break
    rank++
  }
  return rank
}

export async function fetchLeaderboard(limitCount = 20) {
  const q = query(
    collection(db, PLAYERS),
    orderBy('bestScore', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
