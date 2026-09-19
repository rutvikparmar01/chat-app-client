# Chat App — Frontend

React + Vite + TypeScript frontend for a full-stack chat application. Talks to a separate Express/Socket.IO backend over REST and WebSockets.

## Tech Stack

- React (Vite) + TypeScript
- MUI (Material UI) for components
- React Router for routing
- Axios for REST calls
- socket.io-client for real-time messaging

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and point it at your backend:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
3. Run the dev server:
   ```
   npm run dev
   ```
   The app is served at `http://localhost:5173`.

## Env Vars

| Variable          | Description                                  |
| ------------------ | --------------------------------------------- |
| `VITE_API_URL`     | Base URL for REST calls (e.g. `.../api`)      |
| `VITE_SOCKET_URL`  | Base URL for the Socket.IO server              |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production (`dist/`)
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint

## Features Implemented

- Auth: register/login, JWT stored in `localStorage`, attached to Axios and the socket connection via `AuthContext`
- Protected routing: `/chat` redirects to `/login` when unauthenticated
- Real-time connection via `SocketContext` — connects on login, disconnects on logout
- Sidebar with tabs for existing conversations and a searchable user directory; starting a chat from the Users tab creates a conversation
- Conversation/group list with last message preview, timestamp, and unread badge, kept live via `message:new` socket events
- Chat window: paginated-ready message fetch, auto-scroll to latest, loading/error states, message send box
- Online/offline presence indicator (1-1) via `presence:update`
- Group creation dialog (name + multi-select members)
- Reconnecting banner when the socket disconnects

## Assumptions

- Backend issues a JWT on register/login and accepts it both as `Authorization: Bearer <token>` (REST) and as `auth: { token }` on the Socket.IO handshake.
- `GET /conversations` returns a unified list of 1-1 conversations and groups, distinguished by an `isGroup` flag, each with `lastMessage`, `unreadCount`, and `updatedAt`.
- Message objects include a populated `sender` (user object, not just an id).

## Known Limitations

- Message list fetch always loads the first page; infinite-scroll pagination (`page`/`limit`) is wired into the API layer but not yet triggered from the UI.
- Unread counts render from the initial conversation list but aren't decremented/incremented live from socket events yet.
- Stretch features — typing indicators, message reactions, edit/delete message UI — are not implemented in this pass.
