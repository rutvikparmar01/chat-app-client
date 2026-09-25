import { useMemo, useState } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { colors, gradients, radii } from "../theme";
import { SearchInput, SoftButton, UserAvatar } from "./ui";
import type { User } from "../types";

interface UserPickerProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selected: User[];
  onToggle: (user: User) => void;
  onlineUserIds: Set<string>;
  label?: string;
}

function PickerCheckbox({ checked }: { checked: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: "7px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: checked ? gradients.primary : colors.paper,
        border: checked ? "none" : `1.5px solid ${colors.border}`,
        color: colors.white,
      }}
    >
      {checked && <CheckIcon sx={{ fontSize: 15 }} />}
    </Box>
  );
}

export function UserPicker({
  users,
  loading,
  error,
  onRetry,
  selected,
  onToggle,
  onlineUserIds,
  label = "Members",
}: UserPickerProps) {
  const [query, setQuery] = useState("");
  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.label }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.primary }} aria-live="polite">
          {selected.length} selected
        </Typography>
      </Box>

      {selected.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selected.map((u) => (
            <Box
              key={u.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                pl: 0.5,
                pr: 0.5,
                height: 30,
                borderRadius: `${radii.pill}px`,
                bgcolor: colors.softPrimaryBg,
                color: colors.softPrimaryText,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <UserAvatar name={u.username} userId={u.id} size={22} />
              {u.username}
              <ButtonBase
                aria-label={`Remove ${u.username}`}
                onClick={() => onToggle(u)}
                sx={{ width: 20, height: 20, borderRadius: "50%", color: colors.softPrimaryText, "&:hover": { bgcolor: colors.paper } }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </ButtonBase>
            </Box>
          ))}
        </Box>
      )}

      <SearchInput value={query} onChange={setQuery} placeholder="Search by name or @username" variant="outlined" />

      <Box
        role="listbox"
        aria-multiselectable
        aria-label={label}
        sx={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5, mx: -0.5, px: 0.5 }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 3 }}>
            <Typography sx={{ fontSize: 13, color: colors.dangerText }}>{error}</Typography>
            <SoftButton size="small" onClick={onRetry}>
              Try again
            </SoftButton>
          </Box>
        ) : filtered.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", py: 3 }}>
            {users.length === 0 ? "No one else to add yet." : "No people match your search."}
          </Typography>
        ) : (
          filtered.map((u) => {
            const checked = selectedIds.has(u.id);
            const online = onlineUserIds.has(u.id);
            return (
              <ButtonBase
                key={u.id}
                role="option"
                aria-selected={checked}
                onClick={() => onToggle(u)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.25,
                  borderRadius: `${radii.button}px`,
                  textAlign: "left",
                  bgcolor: checked ? colors.selectedRowBg : "transparent",
                  "&:hover": { bgcolor: checked ? colors.selectedRowBg : colors.inputBg },
                }}
              >
                <UserAvatar name={u.username} userId={u.id} size={40} status={online ? "online" : "offline"} ringColor={checked ? colors.selectedRowBg : colors.paper} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>
                    {u.username}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 12, color: colors.textSecondary }}>
                    {u.email} ·{" "}
                    <Box component="span" sx={{ color: online ? colors.successText : colors.muted, fontWeight: 500 }}>
                      {online ? "Online" : "Offline"}
                    </Box>
                  </Typography>
                </Box>
                <PickerCheckbox checked={checked} />
              </ButtonBase>
            );
          })
        )}
      </Box>
    </Box>
  );
}
