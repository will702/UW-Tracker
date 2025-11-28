# UW Tracker

Production-ready Expo (React Native + Web) application plus a standalone Express/MongoDB API for tracking Indonesian IPO underwriter performance.

## Repository layout

```
UW-Tracker/
├── frontend/            # Expo client (mobile + web)
└── backend/             # Express API (MongoDB)
```

The two packages are independent—run and deploy each from its own directory.

## Getting started (Expo app)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Set up your `.env` (see `frontend/docs/FIREBASE_SETUP.md` for the required keys).
3. Launch Metro:
   ```bash
   npm start
   ```
4. Choose `i` (iOS simulator), `a` (Android), or `w` (web) from the Expo CLI.

Full instructions live in `frontend/QUICK_START.md`.

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

- `frontend/DOCUMENTATION_SUMMARY.md` – master index of every active guide.
- Key topics (all inside `frontend/docs/`):
  - Setup: `README.md`, `QUICK_START.md`
  - Firebase data + envs: `FIREBASE_SETUP.md`, `FIREBASE_MIGRATION.md`
  - Deployment: `WEB_DEPLOY_QUICK_START.md`, `DEPLOY_QUICK_START.md`
  - Troubleshooting: `TROUBLESHOOTING.md`, `FIREBASE_DATA_TROUBLESHOOTING.md`

## Development Environment

This project includes a comprehensive development setup for scalable development:

### Code Quality Tools

- **ESLint**: Code linting for both backend and frontend
- **Prettier**: Code formatting with consistent style
- **EditorConfig**: Consistent coding styles across editors
- **TypeScript**: Type checking enabled

### Available Scripts

**Backend:**

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Type check without emitting
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

**Frontend:**

```bash
cd frontend
npm start            # Start Expo development server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Type check without emitting
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Version Control

- **Node Version**: Use Node.js 20+ (specified in `.nvmrc`)
- **Git Hooks**: Consider adding pre-commit hooks for linting/formatting
- **Branch Strategy**: See `CONTRIBUTING.md` for guidelines

### VS Code Setup

Recommended extensions (see `.vscode/extensions.json`):

- Prettier
- ESLint
- EditorConfig
- TypeScript

Settings are configured in `.vscode/settings.json` for automatic formatting on save.

### CI/CD

GitHub Actions workflows are configured for:

- Automated linting and type checking
- Build verification
- Pull request validation

See `.github/workflows/ci.yml` for details.

### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Production readiness

- Expo application consumes the hosted Express API (configure `EXPO_PUBLIC_API_URL`).
- Backend exposes `/api/health`, `/api/records`, `/api/stats`, and `/api/records` (POST) endpoints.
- EAS build profiles configured for iOS and Android.
- Web export (`npm run build:web`) ready for static hosting (Vercel, Firebase Hosting, Netlify, etc.).
