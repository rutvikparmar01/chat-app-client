import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import { getUsers } from "../api/users";
import { createConversation } from "../api/conversations";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { threadLabel, formatTimestamp } from "../utils/thread";
import type { User } from "../types";

export function Sidebar({ onCreateGroup }: { onCreateGroup: () => void }) {
  const { user, logout } = useAuth();
  const { threads, loading, refresh, activeThread, setActiveThread, onlineUserIds, seedOnline } = useChat();
  const [tab, setTab] = useState<"conversations" | "users">("conversations");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "users") return;
    let active = true;
    setUsersLoading(true);
    const timer = setTimeout(() => {
      getUsers(search || undefined)
        .then(({ data }) => {
          if (!active) return;
          setUsers(data.filter((u) => u.id !== user?.id));
          seedOnline(data);
        })
        .finally(() => {
          if (active) setUsersLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tab, search, user?.id, seedOnline]);

  async function handleStartConversation(userId: string) {
    setCreatingId(userId);
    try {
      const { data } = await createConversation(userId);
      await refresh();
      setActiveThread(data);
      setTab("conversations");
    } finally {
      setCreatingId(null);
    }
  }

  const filteredThreads = threads?.filter((t) =>
    threadLabel(t, user?.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        borderRight: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Chat
        </Typography>
        <Box>
          <IconButton size="small" onClick={onCreateGroup} title="New group">
            <GroupAddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={logout} title="Log out">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={tab === "conversations" ? "Search conversations" : "Search users"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="Conversations" value="conversations" />
          <Tab label="Users" value="users" />
        </Tabs>
        <Divider />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {tab === "conversations" ? (
          loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredThreads.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No conversations yet
            </Typography>
          ) : (
            <List disablePadding>
              {filteredThreads.map((thread) => {
                const other = !thread.isGroup
                  ? thread.participants.find((p) => p.id !== user?.id)
                  : undefined;
                const isOnline = other ? onlineUserIds.has(other.id) : false;
                return (
                  <ListItemButton
                    key={thread.id}
                    selected={activeThread?.id === thread.id}
                    onClick={() => setActiveThread(thread)}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        variant="dot"
                        color={isOnline ? "success" : "default"}
                        invisible={thread.isGroup}
                      >
                        <Avatar>{threadLabel(thread, user?.id)[0]?.toUpperCase()}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={threadLabel(thread, user?.id)}  
                      secondary={thread.lastMessage?.content ?? "No messages yet"}
                      slotProps={{ secondary: { noWrap: true } }}
                    />
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, ml: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(thread.updatedAt)}
                      </Typography>
                      {!!thread.unreadCount && (
                        <Badge badgeContent={thread.unreadCount} color="primary" />
                      )}
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )
        ) : usersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List disablePadding>
            {users.map((u) => (
              <ListItemButton
                key={u.id}
                disabled={creatingId === u.id}
                onClick={() => handleStartConversation(u.id)}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color={onlineUserIds.has(u.id) ? "success" : "default"}
                  >
                    <Avatar>{u.username[0]?.toUpperCase()}</Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText primary={u.username} secondary={u.email} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
