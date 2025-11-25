# UW Tracker

Production-ready Expo (React Native + Web) application for tracking Indonesian IPO underwriter performance with Firebase as the primary data store.

## Repository layout

```
UW-Tracker/
├── react-native-expo/        # Main app (Expo + TypeScript + Firebase)
└── README.md
```

All legacy FastAPI/Vite code, MongoDB scripts, and data dumps were removed to keep the repository focused on the production Expo build.

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

Full instructions live in `react-native-expo/docs/QUICK_START.md`.

## Documentation

- `react-native-expo/DOCUMENTATION_SUMMARY.md` – master index of every active guide.
- Key topics (all inside `react-native-expo/docs/`):
  - Setup: `README.md`, `QUICK_START.md`
  - Firebase data + envs: `FIREBASE_SETUP.md`, `FIREBASE_MIGRATION.md`
  - Deployment: `WEB_DEPLOY_QUICK_START.md`, `DEPLOY_QUICK_START.md`
  - Troubleshooting: `TROUBLESHOOTING.md`, `FIREBASE_DATA_TROUBLESHOOTING.md`

## Production readiness

- Offline-capable Expo application with Firestore caching.
- Direct database access from the client (no dedicated API server required).
- EAS build profiles configured for iOS and Android.
- Web export (`npm run build:web`) ready for static hosting (Vercel, Firebase Hosting, Netlify, etc.).

## Legacy components

The FastAPI backend, Vite frontend, and MongoDB scripts are archived. Use them only for reference; no further updates are planned.

