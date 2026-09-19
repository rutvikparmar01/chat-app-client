import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
} from "@mui/material";
import { getUsers } from "../api/users";
import { createGroup } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import type { User } from "../types";

export function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { refresh, setActiveThread } = useChat();
  const [name, setName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    setUsersError(null);
    getUsers()
      .then(({ data }) => setUsers(data.filter((u) => u.id !== user?.id)))
      .catch(() => setUsersError("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelected([]);
    setError(null);
    loadUsers();
  }, [open, loadUsers]);

  function toggle(u: User) {
    setSelected((prev) =>
      prev.some((s) => s.id === u.id) ? prev.filter((s) => s.id !== u.id) : [...prev, u]
    );
  }

  async function handleCreate() {
    if (!name.trim() || selected.length === 0) {
      setError("Group name and at least one member are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await createGroup(
        name.trim(),
        selected.map((u) => u.id)
      );
      await refresh();
      setActiveThread(data);
      onClose();
    } catch {
      setError("Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New group</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Group name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        {selected.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {selected.map((u) => (
              <Chip key={u.id} label={u.username} onDelete={() => toggle(u)} size="small" />
            ))}
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {usersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : usersError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadUsers}>
                Retry
              </Button>
            }
          >
            {usersError}
          </Alert>
        ) : (
          <List dense sx={{ maxHeight: 280, overflow: "auto" }}>
            {users.map((u) => {
              const checked = selected.some((s) => s.id === u.id);
              return (
                <ListItem key={u.id} disablePadding>
                  <ListItemButton onClick={() => toggle(u)}>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    <ListItemAvatar>
                      <Avatar>{u.username[0]?.toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.username} secondary={u.email} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={submitting}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
