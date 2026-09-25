import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import { getUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { useOpenDirectChat } from "../hooks/useOpenDirectChat";
import { colors, gradients, radii, shadows } from "../theme";
import { threadLabel, threadMembers, threadOtherUser } from "../utils/thread";
import { ConversationRow } from "./ConversationRow";
import { ConversationRowSkeleton, SearchInput, Segmented, SoftButton, UserAvatar } from "./ui";
import type { ChatThread, User } from "../types";

type Filter = "all" | "direct" | "groups";

function Overline({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, pt: 0.75 }}>
      <Typography variant="overline" component="h3" sx={{ color: colors.muted }}>
        {children}
      </Typography>
      {action}
    </Box>
  );
}

function ComposeButton({ onClick, mobile }: { onClick: () => void; mobile?: boolean }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-label="New group"
      sx={{
        width: 40,
        height: 40,
        borderRadius: `${radii.button}px`,
        background: gradients.primary,
        boxShadow: shadows.primaryButton,
        color: colors.white,
        flexShrink: 0,
        "&:hover": { filter: "brightness(1.05)" },
      }}
    >
      {mobile ? <EditOutlinedIcon sx={{ fontSize: 19 }} /> : <AddIcon sx={{ fontSize: 22 }} />}
    </ButtonBase>
  );
}

function LoadingState() {
  return (
    <Box aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <ConversationRowSkeleton key={i} />
      ))}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 2, color: colors.textSecondary }}>
        <RefreshIcon sx={{ fontSize: 16, animation: "cs-spin 1s linear infinite" }} />
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Loading conversations…</Typography>
      </Box>
    </Box>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box role="alert" sx={{ m: 1, p: 2.5, borderRadius: `${radii.card}px`, border: `1px solid ${colors.border}`, textAlign: "center" }}>
      <WarningAmberRoundedIcon sx={{ color: colors.warning, fontSize: 28 }} />
      <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 1 }}>{message}</Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5, mb: 1.5 }}>Check your connection and try again.</Typography>
      <SoftButton size="small" onClick={onRetry} startIcon={<RefreshIcon />}>
        Try again
      </SoftButton>
    </Box>
  );
}

export function Sidebar({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { user } = useAuth();
  const { threads, loading, error, refresh, activeThread, setActiveThread, onlineUserIds, seedOnline, typingByThread } = useChat();
  const { openCreateGroup } = useUi();
  const { openDirectChat, openingId } = useOpenDirectChat();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const navigate = useNavigate();
  const mobile = variant === "mobile";
  const query = search.trim();

  // People search (the old "Users" tab) — only runs while there's a query.
  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    let active = true;
    setUsersLoading(true);
    const timer = setTimeout(() => {
      getUsers(query)
        .then(({ data }) => {
          if (!active) return;
          setUsers(data.filter((u) => u.id !== user?.id));
          seedOnline(data);
        })
        .catch(() => {
          if (active) setUsers([]);
        })
        .finally(() => {
          if (active) setUsersLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, user?.id, seedOnline]);

  const counts = useMemo(
    () => ({
      all: threads.length,
      direct: threads.filter((t) => !t.isGroup).length,
      groups: threads.filter((t) => t.isGroup).length,
    }),
    [threads]
  );

  const unreadTotal = threads.reduce((sum, t) => sum + (t.id === activeThread?.id ? 0 : t.unreadCount ?? 0), 0);

  const visibleThreads = useMemo(
    () =>
      threads.filter((t) => {
        if (filter === "direct" && t.isGroup) return false;
        if (filter === "groups" && !t.isGroup) return false;
        return threadLabel(t, user?.id).toLowerCase().includes(query.toLowerCase());
      }),
    [threads, filter, query, user?.id]
  );

  // People from the search who you don't already have a direct chat with.
  const directPartnerIds = useMemo(
    () => new Set(threads.filter((t) => !t.isGroup).map((t) => threadOtherUser(t, user?.id)?.id)),
    [threads, user?.id]
  );
  const peopleResults = users.filter((u) => !directPartnerIds.has(u.id));

  // Mobile "Online now" strip: everyone you share a chat with who is online.
  const onlineNow = useMemo(() => {
    if (!mobile) return [];
    const seen = new Map<string, User>();
    threads.forEach((t) =>
      threadMembers(t).forEach((m) => {
        if (m.id !== user?.id && onlineUserIds.has(m.id)) seen.set(m.id, m);
      })
    );
    return Array.from(seen.values());
  }, [mobile, threads, onlineUserIds, user?.id]);

  const handleSelect = useCallback((thread: ChatThread) => setActiveThread(thread), [setActiveThread]);

  return (
    <Box
      component="section"
      aria-label="Conversations"
      sx={{
        width: mobile ? "100%" : { md: 320, lg: 372 },
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.paper,
        borderRight: mobile ? "none" : `1px solid ${colors.divider}`,
      }}
    >
      <Box sx={{ px: mobile ? 2.5 : 2.5, pt: mobile ? 2.5 : 3, pb: 1.75, display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Typography variant={mobile ? "h2" : "h4"} component="h1" sx={{ letterSpacing: "-0.02em" }}>
              {mobile ? "Chats" : "Messages"}
            </Typography>
            {!mobile && unreadTotal > 0 && (
              <Box sx={{ px: 1.125, py: 0.375, borderRadius: `${radii.pill}px`, bgcolor: colors.softPrimaryBg, color: colors.softPrimaryText, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                {unreadTotal} unread
              </Box>
            )}
          </Box>
          <ComposeButton onClick={() => openCreateGroup()} mobile={mobile} />
        </Box>
        <SearchInput value={search} onChange={setSearch} placeholder={mobile ? "Search" : "Search people or groups"} hint={mobile ? undefined : "⌘K"} />
        {!mobile && (
          <Segmented<Filter>
            ariaLabel="Filter conversations"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "direct", label: "Direct", count: counts.direct },
              { value: "groups", label: "Groups", count: counts.groups },
            ]}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1.5, pb: 2 }}>
        {mobile && onlineNow.length > 0 && !query && (
          <Box sx={{ mb: 1 }}>
            <Overline
              action={
                <Box component={RouterLink} to="/people" sx={{ fontSize: 12, fontWeight: 600, color: colors.primary, textDecoration: "none" }}>
                  See all
                </Box>
              }
            >
              ONLINE NOW
            </Overline>
            <Box sx={{ display: "flex", gap: 1.75, overflowX: "auto", px: 1.5, py: 1.25, scrollbarWidth: "none" }}>
              {onlineNow.map((u) => (
                <ButtonBase
                  key={u.id}
                  onClick={() => openDirectChat(u.id)}
                  aria-label={`Message ${u.username}`}
                  sx={{ flexDirection: "column", gap: 0.75, borderRadius: `${radii.button}px`, width: 56, flexShrink: 0 }}
                >
                  <UserAvatar name={u.username} userId={u.id} size={52} status="online" />
                  <Typography noWrap sx={{ fontSize: 12, fontWeight: 500, color: colors.label, maxWidth: 56 }}>
                    {u.username}
                  </Typography>
                </ButtonBase>
              ))}
            </Box>
          </Box>
        )}

        {!mobile && <Overline>RECENT CONVERSATIONS</Overline>}

        <Box sx={{ mt: 1 }}>
          {loading && threads.length === 0 ? (
            <LoadingState />
          ) : error && threads.length === 0 ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : visibleThreads.length === 0 && !query ? (
            <Box sx={{ textAlign: "center", px: 3, py: 5 }}>
              <ChatBubbleOutlinedIcon sx={{ fontSize: 32, color: colors.softPrimaryBorder }} />
              <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 1 }}>No conversations yet</Typography>
              <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5, mb: 2 }}>
                Find someone to message or start a group.
              </Typography>
              <SoftButton onClick={() => navigate("/people")} size="small">
                Browse people
              </SoftButton>
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
              {visibleThreads.map((thread) => {
                const other = threadOtherUser(thread, user?.id);
                return (
                  <li key={thread.id}>
                    <ConversationRow
                      thread={thread}
                      currentUserId={user?.id}
                      active={activeThread?.id === thread.id}
                      online={other ? onlineUserIds.has(other.id) : false}
                      typing={(typingByThread[thread.id]?.length ?? 0) > 0}
                      onSelect={handleSelect}
                    />
                  </li>
                );
              })}
            </Box>
          )}
        </Box>

        {query && (
          <Box sx={{ mt: 2 }}>
            <Overline>PEOPLE</Overline>
            {usersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={22} />
              </Box>
            ) : peopleResults.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: colors.textSecondary, px: 1.5, py: 1.5 }}>
                {visibleThreads.length === 0 ? `No results for “${query}”.` : "No other people match."}
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 1 }}>
                {peopleResults.map((u) => {
                  const online = onlineUserIds.has(u.id);
                  return (
                    <ButtonBase
                      key={u.id}
                      disabled={openingId === u.id}
                      onClick={() => openDirectChat(u.id)}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: `${radii.listItem}px`, textAlign: "left", "&:hover": { bgcolor: colors.inputBg } }}
                    >
                      <UserAvatar name={u.username} userId={u.id} size={40} status={online ? "online" : "offline"} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                          {u.username}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: 12, color: colors.textSecondary }}>
                          {u.email}
                        </Typography>
                      </Box>
                      {openingId === u.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>Message</Typography>
                      )}
                    </ButtonBase>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
