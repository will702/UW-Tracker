# UW Tracker API

Standalone Express + MongoDB backend used by the UW Tracker mobile/web clients.

## 1. Environment variables

Create an `.env` file inside `backend/` (see `env.example` for reference):

```
MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net"
DATABASE_NAME="uw_tracker"
COLLECTION_NAME="uw_records"
API_PORT=3001
```

## 2. Install dependencies

```
cd backend
npm install
```

## 3. Run locally

```
npm run dev          # hot reload via tsx, listens on API_PORT (default 3001)
npm run import       # import data/sample-records.json
```

## 4. Build / start (optional)

```
npm run build
npm start            # runs compiled dist/server.js
```

## 5. Endpoints

- `GET /api/health`
- `GET /api/records`
- `POST /api/records`
- `GET /api/grouped-records`
- `GET /api/stats`
- `GET /api/underwriters`
- `GET /api/record/:id`
- `POST /api/record/create`
- `POST /api/record/delete`

Add more routes under `src/routes/`.

## 6. Deploying to Vercel

```
vercel login
cd backend
vercel link
vercel env add MONGODB_URL
vercel env add DATABASE_NAME
vercel env add COLLECTION_NAME
vercel env add API_PORT   # optional
vercel deploy --prod
```

Vercel will treat `src/index.ts` as the serverless entry point. Set `EXPO_PUBLIC_API_URL` in the frontend project to the deployed domain so the apps call this backend.
