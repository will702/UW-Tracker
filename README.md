# UW Tracker

Production-ready Expo (React Native + Web) application plus a standalone Express/MongoDB API for tracking Indonesian IPO underwriter performance.

## Repository layout

```
UW-Tracker/
├── react-native-expo/   # Expo client (mobile + web)
└── backend/             # Express API (MongoDB)
```

The two packages are independent—run and deploy each from its own directory.

## Getting started (Expo app)

1. Install dependencies:
   ```bash
   cd react-native-expo
   npm install
   ```
2. Set up your `.env` (see `react-native-expo/docs/FIREBASE_SETUP.md` for the required keys).
3. Launch Metro:
   ```bash
   npm start
   ```
4. Choose `i` (iOS simulator), `a` (Android), or `w` (web) from the Expo CLI.

Full instructions live in `react-native-expo/QUICK_START.md`.

## Getting started (API)

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `env.example` to `.env` and add your MongoDB credentials.
3. Launch the server:
   ```bash
   npm run dev
   ```
4. Deploy with Vercel:
   ```bash
   vercel deploy --prod
   ```

See `backend/README.md` for more details.

## Documentation

- `react-native-expo/DOCUMENTATION_SUMMARY.md` – master index of every active guide.
- Key topics (all inside `react-native-expo/docs/`):
  - Setup: `README.md`, `QUICK_START.md`
  - Firebase data + envs: `FIREBASE_SETUP.md`, `FIREBASE_MIGRATION.md`
  - Deployment: `WEB_DEPLOY_QUICK_START.md`, `DEPLOY_QUICK_START.md`
  - Troubleshooting: `TROUBLESHOOTING.md`, `FIREBASE_DATA_TROUBLESHOOTING.md`

## Production readiness

- Expo application consumes the hosted Express API (configure `EXPO_PUBLIC_API_URL`).
- Backend exposes `/api/health`, `/api/records`, `/api/stats`, and `/api/records` (POST) endpoints.
- EAS build profiles configured for iOS and Android.
- Web export (`npm run build:web`) ready for static hosting (Vercel, Firebase Hosting, Netlify, etc.).

