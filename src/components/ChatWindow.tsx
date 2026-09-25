import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import { getConversationMessages } from "../api/conversations";
import { getGroupMessages } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useSocket } from "../context/SocketContext";
import { threadLabel, threadOtherUser } from "../utils/thread";
import { normalizeIds } from "../utils/normalize";
import { apiError } from "../utils/apiError";
import { dayLabel } from "../utils/time";
import { deleteMessage, editMessage, reactToMessage } from "../api/messages";
import { colors, gradients, radii, shadows } from "../theme";
import { MessageBubble } from "./MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { Composer } from "./chat/Composer";
import { TypingIndicator } from "./chat/TypingIndicator";
import { ChatSkeleton, ConnectionBanner, DatePill, EmptyChat, ForbiddenCard, HistoryErrorCard, UnreadDivider } from "./chat/ChatStates";
import type { Message, TypingUpdate } from "../types";

const TYPING_STOP_DELAY_MS = 2000;
// Safety net in case a typing:stop event is dropped (e.g. tab closed mid-type).
const TYPING_STALE_MS = 4000;
const MESSAGES_PAGE_LIMIT = 30;

interface ChatWindowProps {
  membersOpen?: boolean;
  onToggleMembers?: () => void;
  /** Mobile: full-screen chat with a back chevron and pill composer. */
  mobile?: boolean;
}

export function ChatWindow({ membersOpen = false, onToggleMembers = () => {}, mobile = false }: ChatWindowProps) {
  const { user } = useAuth();
  const { activeThread, setActiveThread, onlineUserIds, refresh, lastSeenById } = useChat();
  const { socket, status, reconnectAttempt, reconnect } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState("");
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const isNearBottomRef = useRef(true);
  const pageRef = useRef(1);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const isPrependRef = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIsActive = useRef(false);
  const typingClearTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const threadId = activeThread?.id;
  const isGroup = !!activeThread?.isGroup;
  // Unread count as it was when this thread was opened, before it gets marked read.
  const unreadAtOpenRef = useRef(0);
  unreadAtOpenRef.current = activeThread?.unreadCount ?? 0;

  useEffect(() => {
    if (!threadId) return;
    let active = true;
    const unreadAtOpen = unreadAtOpenRef.current;
    setLoading(true);
    setError(null);
    setFirstUnreadId(null);
    pageRef.current = 1;
    const fetcher = isGroup
      ? getGroupMessages(threadId, 1, MESSAGES_PAGE_LIMIT)
      : getConversationMessages(threadId, 1, MESSAGES_PAGE_LIMIT);
    fetcher
      .then(({ data }) => {
        if (!active) return;
        setMessages(data);
        setHasMoreHistory(data.length === MESSAGES_PAGE_LIMIT);
        if (unreadAtOpen > 0 && unreadAtOpen < data.length) {
          setFirstUnreadId(data[data.length - unreadAtOpen]?.id ?? null);
        }
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Failed to load messages"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [threadId, isGroup, reloadKey]);

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
    setDraft("");
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

  // Keep the typing indicator in view if the user is already at the bottom.
  useEffect(() => {
    if (typingUserIds.size > 0 && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUserIds.size]);

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

  const handleReact = useCallback((messageId: string, emoji: string) => {
    reactToMessage(messageId, emoji).catch(() => {
      // message:reaction_updated is the source of truth; a failed request
      // just means the optimistic-free UI doesn't change, no error state needed.
    });
  }, []);

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    editMessage(messageId, content)
      .then(({ data }) => {
        setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      })
      .catch(() => {
        // message:updated broadcasts back to the room including the editor,
        // so a transient failure here just means this optimistic path missed —
        // the socket event (if the request actually succeeded) still lands.
      });
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteMessage(messageId)
      .then(() => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
      })
      .catch(() => {
        // Same reasoning as handleEditMessage above.
      });
  }, []);

  const roster = activeThread ? (activeThread.isGroup ? activeThread.members : activeThread.participants) : [];
  const resolveUsername = useCallback(
    (userId: string): string => roster.find((member) => member.id === userId)?.username ?? "Someone",
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roster identity changes with the thread
    [activeThread]
  );

  if (!activeThread) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, bgcolor: colors.surface, px: 3, textAlign: "center" }}>
        <Box sx={{ width: 88, height: 88, borderRadius: "50%", background: gradients.softPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChatBubbleOutlinedIcon sx={{ fontSize: 36, color: colors.primary }} />
        </Box>
        <Typography variant="h6" component="p">
          Select a conversation
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.textSecondary }}>Pick a chat from the list, or start a new one.</Typography>
      </Box>
    );
  }

  const title = threadLabel(activeThread, user?.id);
  const otherUser = threadOtherUser(activeThread, user?.id);
  const otherOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;
  const otherLastSeen = otherUser ? lastSeenById[otherUser.id] ?? otherUser.lastSeen : undefined;
  const onlineMemberCount = activeThread.isGroup
    ? activeThread.members.filter((m) => m.id === user?.id || onlineUserIds.has(m.id)).length
    : 0;

  const typingUsers = Array.from(typingUserIds)
    .map((id) => roster.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  // Everyone except me must have read an outgoing message for the double tick.
  const otherMemberIds = roster.filter((m) => m.id !== user?.id).map((m) => m.id);
  function readStateOf(message: Message): "sent" | "read" {
    const readBy = message.readBy ?? [];
    return otherMemberIds.length > 0 && otherMemberIds.every((id) => readBy.includes(id)) ? "read" : "sent";
  }

  const bubbleMaxWidth = membersOpen ? 380 : 460;
  const firstName = title.split(/\s+/)[0];
  const isForbidden = error?.status === 403;

  return (
    <Box component="section" aria-label={`Chat with ${title}`} sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: colors.surface }}>
      <ChatHeader
        thread={activeThread}
        title={title}
        otherUser={otherUser}
        otherOnline={otherOnline}
        otherLastSeen={otherLastSeen}
        typing={!activeThread.isGroup && typingUsers.length > 0}
        onlineMemberCount={onlineMemberCount}
        membersOpen={membersOpen}
        onToggleMembers={onToggleMembers}
        onBack={mobile ? () => setActiveThread(null) : undefined}
        compact={mobile}
      />

      <ConnectionBanner status={status} attempt={reconnectAttempt} onRetry={reconnect} />

      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}
        >
          <Box
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            sx={{ minHeight: "100%", display: "flex", flexDirection: "column", gap: 1.5, px: { xs: 1.5, sm: 2.5, md: 4 }, pt: 2.5, pb: 1 }}
          >
            {loading ? (
              <ChatSkeleton />
            ) : isForbidden ? (
              <ForbiddenCard name={title} onBack={() => setActiveThread(null)} />
            ) : error ? (
              <HistoryErrorCard detail={`${error.message}${error.status ? ` · ${error.status}` : ""}`} onRetry={() => setReloadKey((k) => k + 1)} />
            ) : messages.length === 0 ? (
              <EmptyChat
                name={activeThread.isGroup ? title : firstName}
                starters={activeThread.isGroup ? ["👋 Hi everyone!", "What's everyone working on?"] : [`👋 Hey ${firstName}!`, "How's it going?"]}
                onPick={(text) => {
                  handleDraftChange(text);
                  composerRef.current?.focus();
                }}
              />
            ) : (
              <>
                {/* Pushes a short history to the bottom, like the design. */}
                <Box sx={{ flex: 1 }} />
                {hasMoreHistory && (
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <ButtonBase
                      onClick={handleLoadOlder}
                      disabled={loadingMore}
                      sx={{ px: 1.75, height: 30, borderRadius: `${radii.pill}px`, bgcolor: colors.paper, border: `1px solid ${colors.divider}`, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}
                    >
                      {loadingMore ? <CircularProgress size={14} /> : "Load older messages"}
                    </ButtonBase>
                  </Box>
                )}
                {messages.map((message, i) => {
                  const prev = messages[i - 1];
                  const showDate = !prev || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                  const firstOfRun = showDate || !prev || prev.sender.id !== message.sender.id || message.id === firstUnreadId;
                  const isOwn = message.sender.id === user?.id;
                  return (
                    <Box key={message.id} sx={{ display: "contents" }}>
                      {showDate && <DatePill label={dayLabel(message.createdAt)} />}
                      {message.id === firstUnreadId && <UnreadDivider count={messages.length - i} />}
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        currentUserId={user?.id}
                        onReact={handleReact}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        resolveUsername={resolveUsername}
                        isGroup={activeThread.isGroup}
                        firstOfRun={firstOfRun}
                        maxWidth={bubbleMaxWidth}
                        readState={isOwn ? readStateOf(message) : undefined}
                      />
                    </Box>
                  );
                })}
              </>
            )}
            {!loading && !error && <TypingIndicator users={typingUsers} showAvatars={activeThread.isGroup} />}
            <div ref={bottomRef} />
          </Box>
        </Box>
        {hasNewMessagesBelow && (
          <ButtonBase
            onClick={scrollToBottom}
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              gap: 0.75,
              px: 1.75,
              height: 34,
              borderRadius: `${radii.pill}px`,
              background: gradients.primary,
              boxShadow: shadows.primaryButton,
              color: colors.white,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowDownwardIcon sx={{ fontSize: 15 }} />
            New messages
          </ButtonBase>
        )}
      </Box>

      {!isForbidden && (
        <Composer
          value={draft}
          onChange={handleDraftChange}
          onSubmit={handleSend}
          placeholder={mobile ? "Message" : `Message ${activeThread.isGroup ? title : firstName}…`}
          inputRef={composerRef}
          mobile={mobile}
        />
      )}
    </Box>
  );
}
