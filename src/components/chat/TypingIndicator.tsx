import { Box, Typography } from "@mui/material";
import { colors } from "../../theme";
import { TypingDots, UserAvatar } from "../ui";

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more are typing…`;
}

export function TypingIndicator({ users, showAvatars }: { users: Array<{ id: string; username: string }>; showAvatars: boolean }) {
  if (users.length === 0) return null;
  return (
    <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      {showAvatars && (
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          {users.slice(0, 3).map((u, i) => (
            <Box key={u.id} sx={{ ml: i === 0 ? 0 : -1, borderRadius: "50%", boxShadow: `0 0 0 2px ${colors.surface}` }}>
              <UserAvatar name={u.username} userId={u.id} size={24} />
            </Box>
          ))}
        </Box>
      )}
      <TypingDots />
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.muted }}>{typingText(users.map((u) => u.username))}</Typography>
    </Box>
  );
}
