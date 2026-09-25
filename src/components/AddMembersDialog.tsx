import { useCallback, useEffect, useId, useState } from "react";
import { Box, Dialog, Typography, useMediaQuery, useTheme } from "@mui/material";
import { getUsers } from "../api/users";
import { addGroupMembers } from "../api/groups";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { colors, radii } from "../theme";
import { apiError } from "../utils/apiError";
import { DialogHeader, GhostButton, PrimaryButton } from "./ui";
import { UserPicker } from "./UserPicker";
import type { Group, User } from "../types";

export function AddMembersDialog({ open, onClose, group }: { open: boolean; onClose: () => void; group: Group }) {
  const { refresh, onlineUserIds, seedOnline } = useChat();
  const { toast } = useUi();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = useId();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberKey = group.members.map((m) => m.id).join(",");

  const loadUsers = useCallback(() => {
    const memberIds = new Set(memberKey.split(","));
    setUsersLoading(true);
    setUsersError(null);
    getUsers()
      .then(({ data }) => {
        setUsers(data.filter((u) => !memberIds.has(u.id)));
        seedOnline(data);
      })
      .catch(() => setUsersError("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, [memberKey, seedOnline]);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError(null);
    loadUsers();
  }, [open, loadUsers]);

  function toggle(u: User) {
    setSelected((prev) => (prev.some((s) => s.id === u.id) ? prev.filter((s) => s.id !== u.id) : [...prev, u]));
  }

  async function handleAdd() {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await addGroupMembers(
        group.id,
        selected.map((u) => u.id)
      );
      await refresh();
      toast({
        message: selected.length === 1 ? `Added ${selected[0].username} to ${group.name}` : `Added ${selected.length} people to ${group.name}`,
      });
      onClose();
    } catch (err) {
      const { message, status } = apiError(err, "Failed to add members");
      setError(status === 403 ? "Only group members can add people." : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: { width: 560, maxWidth: fullScreen ? "100%" : "calc(100% - 32px)", ...(fullScreen && { borderRadius: 0 }) } } }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 2.75, overflowY: "auto", flex: 1 }}>
        <DialogHeader id={titleId} title="Add members" subtitle={`Invite people to ${group.name}.`} onClose={onClose} />
        <UserPicker
          users={users}
          loading={usersLoading}
          error={usersError}
          onRetry={loadUsers}
          selected={selected}
          onToggle={toggle}
          onlineUserIds={onlineUserIds}
          label="People"
        />
        {error && (
          <Typography role="alert" sx={{ fontSize: 13, color: colors.dangerText, bgcolor: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, borderRadius: `${radii.input}px`, px: 1.75, py: 1.25 }}>
            {error}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, px: { xs: 2.5, sm: 3.5 }, py: 2.25, borderTop: `1px solid ${colors.divider}` }}>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={handleAdd} disabled={selected.length === 0 || submitting}>
          {submitting ? "Adding…" : `Add ${selected.length || ""} ${selected.length === 1 ? "member" : "members"}`.replace("  ", " ")}
        </PrimaryButton>
      </Box>
    </Dialog>
  );
}
