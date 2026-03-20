// src/firebase/authHelpers.js
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from './config'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

export async function signInWithGoogle() {
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider)
    return null
  } else {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }
}

export async function handleRedirectResult() {
  const result = await getRedirectResult(auth)
  return result?.user || null
}

export async function registerWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function getUsername(uid) {
  const ref = doc(db, 'usernames', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data().username : null
}

export async function saveUsername(uid, username) {
  await setDoc(doc(db, 'usernames', uid), { username, updatedAt: new Date() })
}

export async function isUsernameTaken(username) {
  const ref = doc(db, 'usernameLookup', username.toLowerCase())
  const snap = await getDoc(ref)
  return snap.exists()
}

export async function reserveUsername(uid, username) {
  await setDoc(doc(db, 'usernameLookup', username.toLowerCase()), { uid })
}