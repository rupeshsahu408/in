# Instagram Clone

A full-featured Instagram clone (web + PWA) built on Replit.

## Stack
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS, wouter (router), TanStack Query
- **Backend**: Express + Drizzle ORM, single-port architecture (Express serves Vite middleware in dev, static `dist/public` in prod) on port **5000**
- **Database**: Replit-managed Postgres (Neon serverless driver)
- **Auth**: Firebase Authentication (Google + Email/Password). Backend verifies tokens with `firebase-admin` (falls back to insecure JWT decode in dev when admin SDK not configured)
- **Media storage**: Cloudinary (server-side upload via `multer` + `cloudinary` SDK; falls back to data URLs in dev when not configured)
- **PWA**: `manifest.webmanifest` + `sw.js` registered in `client/index.html`

## Project layout
```
client/                 # React app
  src/
    App.tsx             # Router + lazy routes
    main.tsx            # Entry, registers SW
    components/         # AppShell, PostCard, StoryTray, Modal, Avatar, ...
    pages/              # Home, Login, Profile, Explore, Search, Reels, Notifications, Messages, Post, Settings, FollowList
    hooks/useAuth.ts    # Firebase auth + /api/users/sync
    lib/                # firebase.ts (lazy SDK), api.ts (fetch wrapper with auth header), utils.ts
  index.html
  public/manifest.webmanifest, sw.js, icon.svg
server/
  index.ts              # Express bootstrap, vite middleware, port 5000
  db.ts                 # Drizzle pool + db
  auth.ts               # requireAuth / optionalAuth middleware
  firebase-admin.ts     # Lazy admin init from env
  cloudinary.ts         # Lazy config + uploadBuffer helper
  routes/{users,posts,stories,notifications,messages,upload,config}.ts
shared/schema.ts        # Drizzle tables + zod insert schemas
drizzle.config.ts       # uses DATABASE_URL
vite.config.ts          # root=client, allowedHosts:true, aliases @ @shared @assets
```

## Database schema (`shared/schema.ts`)
`users, posts, postMedia, likes, saves, comments, commentLikes, follows, stories, storyViews, notifications, conversations, conversationMembers, messages`

Push schema changes: `npm run db:push --force`

## Scripts
- `npm run dev` — tsx watch on `server/index.ts` (Vite middleware mounted)
- `npm run build` — Vite build + esbuild server bundle
- `npm run start` — production node `dist/index.js`
- `npm run db:push` — drizzle-kit push

## Required environment variables
None are strictly required to **boot** (the app gracefully handles missing keys), but the following are needed for full functionality:

**Firebase Web SDK (frontend, prefixed with VITE_)**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`

**Firebase Admin SDK (backend)**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (single-line, `\n` for newlines)

**Cloudinary (media uploads)**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Already provisioned**
- `DATABASE_URL` — Replit Postgres

## Deployment
Deploy as **Autoscale**: build `npm run build`, run `npm start`. Push schema (`npm run db:push --force`) before first run.
