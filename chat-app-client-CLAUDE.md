# Chat App — Frontend (chat-app-client)

## Overview
Frontend for a full-stack chat application practical assignment. React + Vite + TypeScript, talking to a separate Express/Socket.IO backend (see API contract below — must match exactly, the backend repo is built against the same contract).

## Tech Stack
- React (Vite) + TypeScript
- MUI (Material UI) for components
- React Router
- Axios (REST calls)
- socket.io-client (real-time)
- Deployment target: Vercel

## Setup Steps (do these first)
1. `npm create vite@latest . -- --template react-ts` (if not already scaffolded)
2. `npm install`
3. Install deps:
   ```
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   npm install react-router-dom axios socket.io-client
   ```
4. Create `.env` and `.env.example`:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
5. Create folder structure:
   ```
   src/
     api/           (axios instance + per-resource API functions)
     components/
     context/        (AuthContext, SocketContext)
     pages/
     types/
     App.tsx
     main.tsx
   ```

## Priority Order
**Core (must work end-to-end before anything else):**
1. Auth pages (login/register) + protected routing + AuthContext (store JWT, attach to axios + socket)
2. SocketContext — connect on login, disconnect on logout, pass JWT via `auth: { token }`
3. Sidebar: user list + search
4. Conversation list (1-1 + group, last message preview, timestamp, unread count)
5. Chat window: message list, send box, auto-scroll to latest, timestamps, loading/error states
6. Group creation + member management UI

**Stretch (only after core works):**
7. Typing indicator UI
8. Message reactions UI
9. Edit/delete message UI (+ "Edited" label)
10. Unread counter live updates via socket

## API Contract
Backend is built against this exact contract — do not deviate.

### REST Endpoints (base: `VITE_API_URL`)
```
POST   /auth/register        { username, email, password }
POST   /auth/login           { email, password } -> { token, user }
GET    /auth/me              (protected)

GET    /users                ?search=  (protected)
GET    /users/:id

GET    /conversations         (protected)
POST   /conversations         { userId }
GET    /conversations/:id/messages   ?page=&limit=

POST   /groups                { name, memberIds: [] }
GET    /groups/:id
POST   /groups/:id/members    { memberIds: [] }
DELETE /groups/:id/members/:userId
GET    /groups/:id/messages   ?page=&limit=

PATCH  /messages/:id          { content }
DELETE /messages/:id
POST   /messages/:id/reactions  { emoji }
```
All protected routes need `Authorization: Bearer <token>` header — set this in the axios instance from AuthContext.

### Socket.IO Events (base: `VITE_SOCKET_URL`)
Connect with `io(SOCKET_URL, { auth: { token } })`.

**Client → Server**
```
message:send      { conversationId?, groupId?, content }
typing:start       { conversationId?, groupId? }
typing:stop        { conversationId?, groupId? }
```

**Server → Client (listen for these)**
```
message:new
message:updated
message:deleted            { messageId }
message:reaction_updated
typing:update                { conversationId?, groupId?, userId, isTyping }
presence:update              { userId, isOnline, lastSeen }
```

## UI Structure
- `/login`, `/register` — public routes
- `/chat` (protected, redirect to `/login` if no token) — main layout:
  - Left: sidebar with tabs/toggle between "Conversations" and "Users" (search included)
  - Center: active chat window
  - Top of chat window: name + online/offline status (1-1) or member list (group)
- Group creation: modal/dialog — name + multi-select of users
- Use MUI components throughout (AppBar, Drawer or Box-based sidebar, List/ListItem for conversations and messages, Avatar, Badge for unread counts, TextField for input)

## State Management
- React Context is enough for this scope — `AuthContext` (user, token, login/logout) and `SocketContext` (socket instance, connection state). No need for Redux/Zustand.
- Keep conversation/message state local to the chat page unless prop-drilling becomes painful — then lift to a `ChatContext`.

## Error & Loading States
- Every API call needs a loading state and an error state shown to the user (MUI `CircularProgress`, `Alert`)
- Handle socket disconnects gracefully (e.g. a small "reconnecting..." indicator)

## Deployment (Vercel)
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Env vars to set in Vercel dashboard: `VITE_API_URL`, `VITE_SOCKET_URL` (point both at the deployed Render backend URL once known)

## When Done
Write a `README.md` covering: setup instructions, env vars needed, how to run locally, features implemented, assumptions made, known limitations.
