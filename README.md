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
- **Admin** (UID `f1Vb911OgwTvPFB1wl4WGgiL8au2`): opens the admin dashboard.
- **Farmers** and **residents**: create accounts from the admin dashboard's **Manage Users** page. The admin supplies the full name, Purok, contact number, email, and role; Barangay and City are fixed to Bañadero, Legazpi. Email is required for Firebase Email/Password sign-in. A temporary password is generated and displayed once after account creation, so the admin must share it securely with the user.
- Existing accounts need a Firestore document at `users/{uid}` with `role` set to `farmer` or `resident`. Publish the included Firestore rules to restrict role assignment to the admin.
- Role dashboards are currently landing pages; crop forms, crop records, and the farmer table have been removed for now.
- The admin dashboard counts farmer and resident profile documents and lists those profiles in the registration activity log. Add a Firestore `createdAt` timestamp to user profiles to show their registration date; existing profiles without it display “Date not recorded.”
