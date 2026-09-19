import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getConversations } from "../api/conversations";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { normalizeIds } from "../utils/normalize";
import type { ChatThread, Message, PresenceUpdate } from "../types";

interface ChatContextValue {
  threads: ChatThread[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  activeThread: ChatThread | null;
  setActiveThread: (thread: ChatThread | null) => void;
  onlineUserIds: Set<string>;
  upsertThreadFromMessage: (message: Message) => void;
  seedOnline: (users: Array<{ id: string; isOnline?: boolean }>) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // The `isOnline` flag on a user only arrives on the response that fetched
  // them (users list, conversation participants, group members) — presence
  // socket events only fire on future connect/disconnect. Seed the online
  // set from that flag so status is accurate on first paint, not just after
  // someone's connection state changes while we're already looking.
  const seedOnline = useCallback((users: Array<{ id: string; isOnline?: boolean }>) => {
    const onlineIds = users.filter((u) => u.isOnline).map((u) => u.id);
    if (onlineIds.length === 0) return;
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      onlineIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getConversations();
      setThreads(data);
      seedOnline(data.flatMap((t) => (t.isGroup ? t.members : t.participants)));
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [seedOnline]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsertThreadFromMessage = useCallback(
    (message: Message) => {
      setThreads((prev) => {
        const threadId = message.groupId ?? message.conversationId;
        const idx = prev.findIndex((t) => t.id === threadId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const isOwnMessage = message.sender.id === user?.id;
        const isThreadOpen = threadId === activeThread?.id;
        const shouldIncrement = !isOwnMessage && !isThreadOpen;
        const thread = {
          ...updated[idx],
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: shouldIncrement ? (updated[idx].unreadCount ?? 0) + 1 : updated[idx].unreadCount,
        };
        updated.splice(idx, 1);
        return [thread, ...updated];
      });
    },
    [user?.id, activeThread?.id]
  );

  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(raw: Message) {
      upsertThreadFromMessage(normalizeIds(raw));
    }

    function handlePresence(update: PresenceUpdate) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (update.isOnline) next.add(update.userId);
        else next.delete(update.userId);
        return next;
      });
    }

    // Rooms are otherwise only assigned when a socket connects, so being added
    // to a new conversation/group while already online wouldn't show up until
    // reconnecting. The server now joins our live socket to the new room and
    // fires one of these — refetch the list so it appears immediately.
    function handleThreadCreatedOrUpdated() {
      refresh();
    }

    socket.on("message:new", handleNewMessage);
    socket.on("presence:update", handlePresence);
    socket.on("conversation:created", handleThreadCreatedOrUpdated);
    socket.on("group:created", handleThreadCreatedOrUpdated);
    socket.on("group:updated", handleThreadCreatedOrUpdated);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("presence:update", handlePresence);
      socket.off("conversation:created", handleThreadCreatedOrUpdated);
      socket.off("group:created", handleThreadCreatedOrUpdated);
      socket.off("group:updated", handleThreadCreatedOrUpdated);
    };
  }, [socket, upsertThreadFromMessage, refresh]);

  // Keep active thread in sync if it gets updated (e.g. group membership changes)
  useEffect(() => {
    if (!activeThread) return;
    const fresh = threads.find((t) => t.id === activeThread.id);
    if (fresh && fresh !== activeThread) setActiveThread(fresh);
  }, [threads, activeThread]);

  return (
    <ChatContext.Provider
      value={{
        threads,
        loading,
        error,
        refresh,
        activeThread,
        setActiveThread,
        onlineUserIds,
        upsertThreadFromMessage,
        seedOnline,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
