# 🏒 NHL Live Scoreboard & Remote Control

A modern, responsive, real-time Ice Hockey Scoreboard application and live game operator remote control styled after Flashscore / Sofascore cards, featuring NHL teams and stadiums.

Powered by **React 18**, **Tailwind CSS**, and **Firebase Firestore**.

---

## 🚀 Deploying to Vercel with Firebase

### Step 1: Deploy to Vercel
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In [Vercel Dashboard](https://vercel.com/), click **Add New Project** and import your repository.
3. Framework Preset will be automatically detected as **Vite**.

### Step 2: Add Firebase Environment Variables in Vercel
In your Vercel Project Settings ➔ **Environment Variables**, add:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Click **Deploy**!

---

## 🔑 Official Admin Login

The live Remote Control is protected behind a dedicated Admin Login:
- **Username**: `admin`
- **Password**: `admin123` &nbsp;(or Scorekeeper PIN: `1234`)

Once logged in, the admin can adjust scores, start/stop/reset the clock, change periods, and edit team names.

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
