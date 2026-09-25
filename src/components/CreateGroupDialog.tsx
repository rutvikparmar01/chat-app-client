import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Dialog, InputBase, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { getUsers } from "../api/users";
import { createGroup } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { colors, radii, shadows } from "../theme";
import { apiError } from "../utils/apiError";
import { DialogHeader, GhostButton, GroupAvatar, PrimaryButton } from "./ui";
import { UserPicker } from "./UserPicker";
import type { User } from "../types";

const NAME_MAX = 50;
// Backend requires a non-empty name and at least one other member.
const MIN_MEMBERS = 1;

export function CreateGroupDialog({
  open,
  onClose,
  preselected = [],
}: {
  open: boolean;
  onClose: () => void;
  preselected?: User[];
}) {
  const { user } = useAuth();
  const { refresh, setActiveThread, onlineUserIds, seedOnline } = useChat();
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = useId();
  const nameId = useId();
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
      .then(({ data }) => {
        setUsers(data.filter((u) => u.id !== user?.id));
        seedOnline(data);
      })
      .catch(() => setUsersError("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, [user?.id, seedOnline]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelected(preselected);
    setError(null);
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open, loadUsers]);

  function toggle(u: User) {
    setSelected((prev) =>
      prev.some((s) => s.id === u.id) ? prev.filter((s) => s.id !== u.id) : [...prev, u]
    );
  }

  const trimmedName = name.trim();
  const canCreate = trimmedName.length > 0 && trimmedName.length <= NAME_MAX && selected.length >= MIN_MEMBERS && !submitting;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await createGroup(
        trimmedName,
        selected.map((u) => u.id)
      );
      await refresh();
      setActiveThread(data);
      navigate("/chat");
      onClose();
    } catch (err) {
      setError(apiError(err, "Failed to create group").message);
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
      slotProps={{
        paper: {
          sx: {
            width: 560,
            maxWidth: "calc(100% - 32px)",
            ...(fullScreen && { maxWidth: "100%", borderRadius: 0 }),
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        sx={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: fullScreen ? "100%" : "calc(100vh - 64px)" }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: 2.5, display: "flex", flexDirection: "column", gap: 2.75, overflowY: "auto", flex: 1 }}>
          <DialogHeader id={titleId} title="Create a new group" subtitle="Give it a name and add at least 1 person." onClose={onClose} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              {/* Stable seed so the preview avatar doesn't change color on every keystroke. */}
              <GroupAvatar groupId="new-group" size={72} />
              <Tooltip title="Group photos aren't supported yet">
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    right: -4,
                    bottom: -4,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    bgcolor: colors.paper,
                    boxShadow: shadows.soft,
                    color: colors.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />
                </Box>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography component="label" htmlFor={nameId} sx={{ fontSize: 13, fontWeight: 600, color: colors.label }}>
                Group name
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  height: 50,
                  px: 1.75,
                  borderRadius: `${radii.input}px`,
                  bgcolor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  "&:focus-within": { bgcolor: colors.paper, borderColor: colors.indigo, boxShadow: shadows.focusRing },
                }}
              >
                <PeopleOutlinedIcon sx={{ fontSize: 18, color: colors.muted }} />
                <InputBase
                  id={nameId}
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                  placeholder="e.g. Sprint Warriors ⚡"
                  sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: colors.ink }}
                />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.muted }} aria-label={`${name.length} of ${NAME_MAX} characters`}>
                  {name.length}/{NAME_MAX}
                </Typography>
              </Box>
            </Box>
          </Box>

          <UserPicker
            users={users}
            loading={usersLoading}
            error={usersError}
            onRetry={loadUsers}
            selected={selected}
            onToggle={toggle}
            onlineUserIds={onlineUserIds}
          />

          {error && (
            <Typography role="alert" sx={{ fontSize: 13, color: colors.dangerText, bgcolor: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, borderRadius: `${radii.input}px`, px: 1.75, py: 1.25 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, px: { xs: 2.5, sm: 3.5 }, py: 2.25, borderTop: `1px solid ${colors.divider}` }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={!canCreate}>
            {submitting ? "Creating…" : `Create group · ${selected.length + 1}`}
          </PrimaryButton>
        </Box>
      </Box>
    </Dialog>
  );
}
