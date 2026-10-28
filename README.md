# Agriculture Monitoring System (React + Firebase + Vercel)

## Firebase setup (once)
1. Authentication → Sign-in method → enable **Email/Password**.
2. Create the admin account in Authentication → Users (its UID must be `f1Vb911OgwTvPFB1wl4WGgiL8au2`).
3. Firestore Database → create database, then paste [firestore.rules](firestore.rules) in the Rules tab and publish.
4. Authentication → Settings → Authorized domains → add your Vercel domain.

## Run locally
```
npm install
npm run dev
```

## Deploy to Vercel
Push to GitHub → Import in Vercel (Vite is auto-detected) → Deploy.
Optional env vars (defaults are already set in `src/firebase.js`): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

## Roles
- **Admin** (UID `f1Vb911OgwTvPFB1wl4WGgiL8au2`): sees/edits all crop records and the farmer list.
- **Farmers** (everyone else): register/login and manage only their own crop records.
