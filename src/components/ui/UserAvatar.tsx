import { Box } from "@mui/material";
import { avatarGradient, colors } from "../../theme";
import { initials } from "../../utils/initials";

interface UserAvatarProps {
  name: string;
  userId: string;
  size?: number;
  status?: "online" | "offline";
  /** Color of the ring around the status dot — match the surface behind the avatar. */
  ringColor?: string;
  /** Force a palette slot instead of hashing `userId` (used by static previews). */
  colorIndex?: number;
}

export function UserAvatar({ name, userId, size = 40, status, ringColor = colors.paper, colorIndex }: UserAvatarProps) {
  const dot = Math.round(size * 0.27);
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Box
        aria-hidden
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: avatarGradient(userId, colorIndex),
          color: colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: Math.round(size * 0.36),
          letterSpacing: "0.01em",
          userSelect: "none",
        }}
      >
        {initials(name)}
      </Box>
      {status && (
        <Box
          role="img"
          aria-label={status === "online" ? "Online" : "Offline"}
          sx={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: dot,
            height: dot,
            borderRadius: "50%",
            bgcolor: status === "online" ? colors.success : colors.muted,
            boxShadow: `0 0 0 2.5px ${ringColor}`,
          }}
        />
      )}
    </Box>
  );
}
