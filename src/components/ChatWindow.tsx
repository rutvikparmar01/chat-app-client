import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import { getConversationMessages } from "../api/conversations";
import { getGroupMessages } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useSocket } from "../context/SocketContext";
import { threadLabel, threadOtherUser } from "../utils/thread";
import { normalizeIds } from "../utils/normalize";
import { deleteMessage, editMessage, reactToMessage } from "../api/messages";
import { MessageBubble } from "./MessageBubble";
import { GroupInfoDialog } from "./GroupInfoDialog";
import type { Message, TypingUpdate } from "../types";

const TYPING_STOP_DELAY_MS = 2000;
// Safety net in case a typing:stop event is dropped (e.g. tab closed mid-type).
const TYPING_STALE_MS = 4000;
const MESSAGES_PAGE_LIMIT = 30;

export function ChatWindow() {
  const { user } = useAuth();
  const { activeThread, setActiveThread, onlineUserIds, refresh } = useChat();
  const { socket, connected } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const pageRef = useRef(1);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const isPrependRef = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIsActive = useRef(false);
  const typingClearTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const threadId = activeThread?.id;
  const isGroup = !!activeThread?.isGroup;

  useEffect(() => {
    if (!threadId) return;
    let active = true;
    setLoading(true);
    setError(null);
    pageRef.current = 1;
    const fetcher = isGroup
      ? getGroupMessages(threadId, 1, MESSAGES_PAGE_LIMIT)
      : getConversationMessages(threadId, 1, MESSAGES_PAGE_LIMIT);
    fetcher
      .then(({ data }) => {
        if (!active) return;
        setMessages(data);
        setHasMoreHistory(data.length === MESSAGES_PAGE_LIMIT);
      })
      .catch(() => {
        if (active) setError("Failed to load messages");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [threadId, isGroup]);

  function handleLoadOlder() {
    if (!threadId || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const fetcher = isGroup
      ? getGroupMessages(threadId, nextPage, MESSAGES_PAGE_LIMIT)
      : getConversationMessages(threadId, nextPage, MESSAGES_PAGE_LIMIT);
    fetcher
      .then(({ data }) => {
        if (data.length > 0) {
          pendingScrollAdjustRef.current = scrollContainerRef.current?.scrollHeight ?? null;
          isPrependRef.current = true;
          setMessages((prev) => [...data, ...prev]);
        }
        pageRef.current = nextPage;
        setHasMoreHistory(data.length === MESSAGES_PAGE_LIMIT);
      })
      .catch(() => {
        // Leave hasMoreHistory as-is so the user can retry the button.
      })
      .finally(() => setLoadingMore(false));
  }

  // Prepending older messages shifts everything down visually unless we
  // compensate scrollTop by exactly how much taller the content just got —
  // otherwise the messages the user was reading jump out of view.
  useLayoutEffect(() => {
    if (pendingScrollAdjustRef.current === null) return;
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop += el.scrollHeight - pendingScrollAdjustRef.current;
    }
    pendingScrollAdjustRef.current = null;
  }, [messages]);

  // Mark the thread read whenever it's opened, and again after connecting
  // if the socket wasn't ready yet the first time.
  useEffect(() => {
    if (!threadId || !socket) return;
    const payload = isGroup ? { groupId: threadId } : { conversationId: threadId };
    socket.emit("message:read", payload, () => refresh());
  }, [threadId, isGroup, socket, refresh]);

  // Typing state is per-thread — reset it whenever the active thread changes.
  useEffect(() => {
    setTypingUserIds(new Set());
    typingClearTimers.current.forEach((timer) => clearTimeout(timer));
    typingClearTimers.current.clear();
    typingIsActive.current = false;
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
  }, [threadId]);

  // A new thread always opens scrolled to the bottom.
  useEffect(() => {
    isNearBottomRef.current = true;
    setHasNewMessagesBelow(false);
  }, [threadId]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
    if (isNearBottomRef.current) setHasNewMessagesBelow(false);
  }

  useEffect(() => {
    if (isPrependRef.current) {
      isPrependRef.current = false;
      return;
    }
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.sender.id === user?.id;
    // Only yank the view to the bottom if the user is already near it, or the
    // new message is their own — someone scrolled up reading history shouldn't
    // get hijacked by an unrelated incoming message.
    if (isNearBottomRef.current || isOwnMessage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessagesBelow(false);
    } else if (messages.length > 0) {
      setHasNewMessagesBelow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new messages arriving, not edits/reactions changing the array reference
  }, [messages.length, user?.id]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessagesBelow(false);
    isNearBottomRef.current = true;
  }

  useEffect(() => {
    if (!socket) return;
    const activeSocket = socket;

    function handleNewMessage(raw: Message) {
      const message = normalizeIds(raw);
      const messageThreadId = message.groupId ?? message.conversationId;
      if (messageThreadId !== threadId) return;
      setMessages((prev) => [...prev, message]);
      // Already viewing this thread — mark the incoming message read immediately
      // instead of letting its unread count tick up until the thread is reopened.
      if (message.sender.id !== user?.id) {
        const payload = isGroup ? { groupId: threadId } : { conversationId: threadId };
        activeSocket.emit("message:read", payload, () => refresh());
      }
    }

    function handleReactionUpdate(raw: Message) {
      const updated = normalizeIds(raw);
      const messageThreadId = updated.groupId ?? updated.conversationId;
      if (messageThreadId !== threadId) return;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }

    function handleMessageUpdated(raw: Message) {
      const updated = normalizeIds(raw);
      const messageThreadId = updated.groupId ?? updated.conversationId;
      if (messageThreadId !== threadId) return;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }

    function handleMessageDeleted({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
    }

    function handleTypingUpdate(update: TypingUpdate) {
      const updateThreadId = update.groupId ?? update.conversationId;
      if (updateThreadId !== threadId || update.userId === user?.id) return;

      const existingTimer = typingClearTimers.current.get(update.userId);
      if (existingTimer) clearTimeout(existingTimer);

      if (update.isTyping) {
        setTypingUserIds((prev) => new Set(prev).add(update.userId));
        typingClearTimers.current.set(
          update.userId,
          setTimeout(() => {
            setTypingUserIds((prev) => {
              const next = new Set(prev);
              next.delete(update.userId);
              return next;
            });
            typingClearTimers.current.delete(update.userId);
          }, TYPING_STALE_MS)
        );
      } else {
        typingClearTimers.current.delete(update.userId);
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(update.userId);
          return next;
        });
      }
    }

    socket.on("message:new", handleNewMessage);
    socket.on("message:reaction_updated", handleReactionUpdate);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("typing:update", handleTypingUpdate);
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:reaction_updated", handleReactionUpdate);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("typing:update", handleTypingUpdate);
    };
  }, [socket, threadId, isGroup, user?.id, refresh]);

  function emitTyping(isTyping: boolean) {
    if (!socket || !threadId) return;
    const payload = isGroup ? { groupId: threadId } : { conversationId: threadId };
    socket.emit(isTyping ? "typing:start" : "typing:stop", payload);
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!value.trim()) {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (typingIsActive.current) {
        typingIsActive.current = false;
        emitTyping(false);
      }
      return;
    }
    if (!typingIsActive.current) {
      typingIsActive.current = true;
      emitTyping(true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      typingIsActive.current = false;
      emitTyping(false);
    }, TYPING_STOP_DELAY_MS);
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !socket || !threadId) return;
    const payload = isGroup
      ? { groupId: threadId, content: draft.trim() }
      : { conversationId: threadId, content: draft.trim() };
    socket.emit("message:send", payload);
    setDraft("");
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    if (typingIsActive.current) {
      typingIsActive.current = false;
      emitTyping(false);
    }
  }

  function handleReact(messageId: string, emoji: string) {
    reactToMessage(messageId, emoji).catch(() => {
      // message:reaction_updated is the source of truth; a failed request
      // just means the optimistic-free UI doesn't change, no error state needed.
    });
  }

  function handleEditMessage(messageId: string, content: string) {
    editMessage(messageId, content)
      .then(({ data }) => {
        setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      })
      .catch(() => {
        // message:updated broadcasts back to the room including the editor,
        // so a transient failure here just means this optimistic path missed —
        // the socket event (if the request actually succeeded) still lands.
      });
  }

  function handleDeleteMessage(messageId: string) {
    deleteMessage(messageId)
      .then(() => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
      })
      .catch(() => {
        // Same reasoning as handleEditMessage above.
      });
  }

  if (!activeThread) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Typography color="text.secondary">Select a conversation to start chatting</Typography>
      </Box>
    );
  }

  const roster = activeThread.isGroup ? activeThread.members : activeThread.participants;
  function resolveUsername(userId: string): string {
    return roster.find((member) => member.id === userId)?.username ?? "Someone";
  }

  const otherUser = threadOtherUser(activeThread, user?.id);
  const otherOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;

  const typingNames = Array.from(typingUserIds)
    .map((id) => {
      if (activeThread.isGroup) return activeThread.members.find((m) => m.id === id)?.username;
      return otherUser?.id === id ? otherUser.username : undefined;
    })
    .filter((name): name is string => !!name);
  const typingLabel =
    typingNames.length === 0
      ? null
      : typingNames.length === 1
        ? `${typingNames[0]} is typing…`
        : `${typingNames.join(", ")} are typing…`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {isMobile && (
          <IconButton size="small" edge="start" onClick={() => setActiveThread(null)}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box
          onClick={() => activeThread.isGroup && setGroupInfoOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: activeThread.isGroup ? "pointer" : "default",
          }}
        >
          {activeThread.isGroup ? (
            <Avatar>
              <GroupIcon fontSize="small" />
            </Avatar>
          ) : (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              color={otherOnline ? "success" : "default"}
            >
              <Avatar>{threadLabel(activeThread, user?.id)[0]?.toUpperCase()}</Avatar>
            </Badge>
          )}
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{threadLabel(activeThread, user?.id)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {activeThread.isGroup
                ? `${activeThread.members.length} members`
                : otherOnline
                  ? "Online"
                  : "Offline"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {activeThread.isGroup && (
        <GroupInfoDialog
          open={groupInfoOpen}
          onClose={() => setGroupInfoOpen(false)}
          group={activeThread}
        />
      )}

      {!connected && (
        <Alert severity="warning" sx={{ borderRadius: 0, flexShrink: 0 }}>
          Reconnecting...
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{ height: "100%", overflow: "auto", px: 2, py: 2 }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
            No messages yet — say hello!
          </Typography>
        ) : (
          <>
            {hasMoreHistory && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                <Button size="small" onClick={handleLoadOlder} disabled={loadingMore}>
                  {loadingMore ? <CircularProgress size={16} /> : "Load older messages"}
                </Button>
              </Box>
            )}
            {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender.id === user?.id}
              currentUserId={user?.id}
              onReact={(emoji) => handleReact(message.id, emoji)}
              onEdit={(content) => handleEditMessage(message.id, content)}
              onDelete={() => handleDeleteMessage(message.id)}
              resolveUsername={resolveUsername}
            />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </Box>
      {hasNewMessagesBelow && (
        <Button
          size="small"
          variant="contained"
          onClick={scrollToBottom}
          sx={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: 5,
          }}
        >
          New messages ↓
        </Button>
      )}
      </Box>

      <Box sx={{ px: 2, height: 20, flexShrink: 0 }}>
        {typingLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            {typingLabel}
          </Typography>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          display: "flex",
          gap: 1,
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
        />
        <IconButton type="submit" color="primary" disabled={!draft.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
