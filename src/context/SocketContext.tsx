import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

/**
 * - `connecting`: first connection attempt after login, nothing to warn about yet.
 * - `connected`: live.
 * - `reconnecting`: dropped, socket.io is retrying on its own.
 * - `disconnected`: dropped and won't retry by itself (server kicked us or retries exhausted).
 */
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  status: ConnectionStatus;
  /** 1-based attempt counter while `status === "reconnecting"`, else 0. */
  reconnectAttempt: number;
  /** Manually kick off a reconnect (the "Retry now" button). */
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  status: "connecting",
  reconnectAttempt: 0,
  reconnect: () => {},
});

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setConnected(false);
      setStatus("connecting");
      setReconnectAttempt(0);
      return;
    }

    const newSocket = io(SOCKET_URL, { auth: { token } });

    newSocket.on("connect", () => {
      setConnected(true);
      setStatus("connected");
      setReconnectAttempt(0);
    });
    newSocket.on("disconnect", () => {
      setConnected(false);
      // `active` is false when socket.io won't retry by itself
      // (server-side disconnect or an explicit client disconnect).
      setStatus(newSocket.active ? "reconnecting" : "disconnected");
    });
    newSocket.on("connect_error", () => {
      if (!newSocket.active) setStatus("disconnected");
    });
    newSocket.io.on("reconnect_attempt", (attempt) => {
      setStatus("reconnecting");
      setReconnectAttempt(attempt);
    });
    newSocket.io.on("reconnect_failed", () => setStatus("disconnected"));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const reconnect = useCallback(() => {
    if (!socket || socket.connected) return;
    setStatus("reconnecting");
    socket.connect();
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, status, reconnectAttempt, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
