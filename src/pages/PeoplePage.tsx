import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Menu, MenuItem, Select, Typography, useMediaQuery, useTheme } from "@mui/material";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { getUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { useOpenDirectChat } from "../hooks/useOpenDirectChat";
import { colors, radii, shadows } from "../theme";
import { CardSkeleton, IconBtn, PrimaryButton, SearchInput, Segmented, SoftButton, StatusPill, UserAvatar } from "../components/ui";
import type { User } from "../types";

type Filter = "all" | "online" | "offline";
type Sort = "online" | "name";

function PersonCard({
  person,
  online,
  lastSeen,
  opening,
  onMessage,
  onMore,
}: {
  person: User;
  online: boolean;
  lastSeen?: string | null;
  opening: boolean;
  onMessage: () => void;
  onMore: (el: HTMLElement) => void;
}) {
  return (
    <Box
      component="li"
      sx={{
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        p: 2.5,
        pt: 3,
        bgcolor: colors.paper,
        borderRadius: `${radii.cardLg}px`,
        border: `1px solid ${colors.divider}`,
        boxShadow: shadows.card,
        minWidth: 0,
      }}
    >
      <UserAvatar name={person.username} userId={person.id} size={72} status={online ? "online" : "offline"} />
      <Typography noWrap sx={{ mt: 1.75, fontSize: 16, fontWeight: 700, maxWidth: "100%" }}>
        {person.username}
      </Typography>
      <Typography noWrap sx={{ fontSize: 13, color: colors.textSecondary, maxWidth: "100%" }}>
        {person.email}
      </Typography>
      <Box sx={{ mt: 1.25 }}>
        <StatusPill online={online} lastSeen={lastSeen} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, width: "100%", mt: 2.25 }}>
        <SoftButton
          fullWidth
          size="small"
          onClick={onMessage}
          disabled={opening}
          startIcon={opening ? <CircularProgress size={14} color="inherit" /> : <ChatBubbleOutlinedIcon sx={{ fontSize: "16px !important" }} />}
          sx={{ height: 36 }}
        >
          Message
        </SoftButton>
        <IconBtn label={`More options for ${person.username}`} icon={<MoreVertIcon />} onClick={(e) => onMore(e.currentTarget)} sx={{ width: 36, height: 36 }} />
      </Box>
    </Box>
  );
}

export default function PeoplePage() {
  const { user } = useAuth();
  const { onlineUserIds, seedOnline, lastSeenById } = useChat();
  const { openCreateGroup } = useUi();
  const { openDirectChat, openingId } = useOpenDirectChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("online");
  const [menu, setMenu] = useState<{ anchor: HTMLElement; person: User } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const query = search.trim().replace(/^@/, "");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      getUsers(query || undefined)
        .then(({ data }) => {
          if (!active) return;
          setUsers(data.filter((u) => u.id !== user?.id));
          seedOnline(data);
        })
        .catch(() => {
          if (active) setError("Couldn't load people");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, user?.id, seedOnline, reloadKey]);

  const isOnline = useCallback((id: string) => onlineUserIds.has(id), [onlineUserIds]);
  const onlineCount = users.filter((u) => isOnline(u.id)).length;

  const visible = useMemo(() => {
    const list = users.filter((u) => (filter === "online" ? isOnline(u.id) : filter === "offline" ? !isOnline(u.id) : true));
    return list.sort((a, b) => {
      if (sort === "online") {
        const diff = Number(isOnline(b.id)) - Number(isOnline(a.id));
        if (diff !== 0) return diff;
      }
      return a.username.localeCompare(b.username);
    });
  }, [users, filter, sort, isOnline]);

  return (
    <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto", bgcolor: colors.surface }}>
      <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h2" component="h1">
              People
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, fontSize: 14, color: colors.textSecondary }}>
              {users.length} {users.length === 1 ? "member" : "members"} ·
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.625, color: colors.successText, fontWeight: 600 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: colors.success }} />
                {onlineCount} online now
              </Box>
            </Box>
          </Box>
          <PrimaryButton startIcon={<GroupAddOutlinedIcon />} onClick={() => openCreateGroup()}>
            New group
          </PrimaryButton>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexDirection: { xs: "column", lg: "row" }, alignItems: { lg: "center" } }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search people by name or @username"
            hint={isMobile ? undefined : "⌘K"}
            height={50}
            variant="outlined"
            sx={{ flex: 1 }}
          />
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", minWidth: 0 }}>
            <Segmented<Filter>
              ariaLabel="Filter people"
              value={filter}
              onChange={setFilter}
              sx={{ bgcolor: colors.paper, border: `1px solid ${colors.border}`, flex: { xs: 1, lg: "none" }, minWidth: 0 }}
              options={[
                { value: "all", label: "All", count: users.length },
                { value: "online", label: "Online", count: onlineCount, dot: colors.success },
                { value: "offline", label: "Offline", count: users.length - onlineCount, dot: colors.muted },
              ]}
            />
            <Select
              size="small"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              inputProps={{ "aria-label": "Sort people" }}
              sx={{ height: 44, minWidth: 140, bgcolor: colors.paper, fontWeight: 500, display: { xs: "none", sm: "inline-flex" } }}
            >
              <MenuItem value="online">Online first</MenuItem>
              <MenuItem value="name">Name A–Z</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          {loading && users.length === 0 ? (
            <Box component="ul" sx={{ m: 0, p: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
              {Array.from({ length: 8 }, (_, i) => (
                <Box component="li" key={i} sx={{ listStyle: "none", bgcolor: colors.paper, borderRadius: `${radii.cardLg}px`, border: `1px solid ${colors.divider}` }}>
                  <CardSkeleton />
                </Box>
              ))}
            </Box>
          ) : error ? (
            <Box role="alert" sx={{ maxWidth: 380, mx: "auto", mt: 4, p: 3, textAlign: "center", bgcolor: colors.paper, borderRadius: `${radii.cardLg}px`, border: `1px solid ${colors.border}` }}>
              <WarningAmberRoundedIcon sx={{ color: colors.warning, fontSize: 30 }} />
              <Typography sx={{ fontWeight: 700, mt: 1 }}>{error}</Typography>
              <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5, mb: 2 }}>Check your connection and try again.</Typography>
              <SoftButton size="small" startIcon={<RefreshIcon />} onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </SoftButton>
            </Box>
          ) : visible.length === 0 ? (
            <Typography sx={{ textAlign: "center", color: colors.textSecondary, py: 6 }}>
              {query ? `No one matches “${query}”.` : filter === "online" ? "Nobody else is online right now." : "No people to show."}
            </Typography>
          ) : (
            <Box component="ul" aria-busy={loading} sx={{ m: 0, p: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
              {visible.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  online={isOnline(person.id)}
                  lastSeen={lastSeenById[person.id] ?? person.lastSeen}
                  opening={openingId === person.id}
                  onMessage={() => openDirectChat(person.id)}
                  onMore={(anchor) => setMenu({ anchor, person })}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem
          onClick={() => {
            const person = menu?.person;
            setMenu(null);
            if (person) openCreateGroup([person]);
          }}
        >
          Start a group with {menu?.person.username}
        </MenuItem>
      </Menu>
    </Box>
  );
}
