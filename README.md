# 🏀 HOOPZ v2 — React Basketball Game

Mobile-first competitive basketball shooting game built with **React + Vite + Firebase**, deployable to **Vercel**.

---

## Tech Stack
- ⚛️ React 18 + Vite
- 🔥 Firebase Firestore + Google Auth
- 🚀 Vercel (hosting)

## User Flow
1. **Continue with Google** — one tap sign in
2. **Pick a callsign** — unique username shown on leaderboard
3. **Play!** — returning players skip straight to the game

## Features
- Google Sign-In (no passwords!)
- Unique callsign/username per player
- Flick mechanic to shoot into a moving hoop
- Combo multiplier system
- 30-second timed rounds
- Global leaderboard with podium + Top 3 prize badges
- Mobile-first, cyberpunk neon aesthetic

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Firebase Setup (step by step)
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it → click through setup
3. **Firestore:** Left sidebar → Firestore Database → Create database → Start in test mode → pick a region
4. **Google Auth:** Left sidebar → Authentication → Get started → Sign-in method tab → Google → Enable → add your email → Save
5. **Get config:** ⚙️ gear → Project Settings → Your apps → click **</>** web icon → register app → copy the firebaseConfig
6. Paste config into `src/firebase/config.js`

### 3. Firestore Rules (for production)
In Firebase → Firestore → Rules tab, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{id}   { allow read, write: if true; }
    match /usernames/{id} { allow read, write: if true; }
    match /usernameLookup/{id} { allow read, write: if true; }
  }
}
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm run build
npx vercel
```
Or drag the folder into vercel.com/new — auto-detects Vite.

---

## File Structure
```
hoopz/
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
├── src/
│   ├── main.jsx
│   ├── App.jsx              ← auth state + screen routing
│   ├── index.css
│   ├── firebase/
│   │   ├── config.js        ← 🔑 Add your Firebase config here
│   │   ├── db.js            ← leaderboard read/write
│   │   └── authHelpers.js   ← Google sign-in, username save/check
│   ├── hooks/
│   │   └── useGameLoop.js
│   ├── components/
│   │   ├── HUD.jsx
│   │   ├── Hoop.jsx
│   │   ├── Ball.jsx
│   │   ├── FlyingBall.jsx
│   │   └── ScorePop.jsx
│   └── pages/
│       ├── Landing.jsx      ← Google sign-in button
│       ├── UsernameSetup.jsx ← callsign picker (first time only)
│       ├── Game.jsx
│       ├── Results.jsx
│       └── Leaderboard.jsx
```

---

## Prize System
Top 3 on the leaderboard get an imaginary prize badge after each game:
- 🥇 **Gold Baller** — Imaginary Yeezys + bragging rights forever
- 🥈 **Silver Shooter** — Imaginary Jordans + a virtual high-five
- 🥉 **Bronze Hooper** — Imaginary Nike Dunks + respect from the streets
