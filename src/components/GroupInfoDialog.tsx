import { useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { removeGroupMember } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import type { Group } from "../types";

export function GroupInfoDialog({
  open,
  onClose,
  group,
}: {
  open: boolean;
  onClose: () => void;
  group: Group;
}) {
  const { user } = useAuth();
  const { onlineUserIds, refresh, setActiveThread } = useChat();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const isCreator = group.createdBy === user?.id;

  async function removeMember(memberId: string, isSelf: boolean) {
    if (!isSelf && !window.confirm("Remove this member from the group?")) return;
    if (isSelf && !window.confirm("Leave this group?")) return;

    setError(null);
    setPendingId(memberId);
    try {
      await removeGroupMember(group.id, memberId);
      if (isSelf) {
        setActiveThread(null);
        onClose();
      }
      await refresh();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? "Only the group creator can remove other members."
          : "Failed to remove member. Try again."
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{group.name}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary">
          {group.members.length} members
        </Typography>
        <List dense>
          {group.members.map((member) => {
            const online = onlineUserIds.has(member.id);
            const isSelf = member.id === user?.id;
            const isMemberCreator = member.id === group.createdBy;
            return (
              <ListItem
                key={member.id}
                secondaryAction={
                  isCreator && !isSelf ? (
                    <IconButton
                      edge="end"
                      size="small"
                      disabled={pendingId === member.id}
                      onClick={() => removeMember(member.id, false)}
                      title="Remove member"
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
                }
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color={online ? "success" : "default"}
                  >
                    <Avatar>{member.username[0]?.toUpperCase()}</Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.username}${isSelf ? " (You)" : ""}`}
                  secondary={
                    (isMemberCreator ? "Creator · " : "") + (online ? "Online" : "Offline")
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
        <Button
          color="error"
          disabled={pendingId === user?.id}
          onClick={() => user && removeMember(user.id, true)}
        >
          Leave group
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
