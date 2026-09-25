import { Box, Typography } from "@mui/material";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import { colors, gradients, radii } from "../../theme";

interface LogoProps {
  /** "onDark" = white tile with primary icon (brand panel); "default" = gradient tile. */
  tone?: "default" | "onDark";
  size?: number;
  showWordmark?: boolean;
}

export function LogoTile({ tone = "default", size = 40 }: Pick<LogoProps, "tone" | "size">) {
  const onDark = tone === "onDark";
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${radii.input}px`,
        background: onDark ? colors.white : gradients.logo,
        color: onDark ? colors.primary : colors.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ChatBubbleOutlinedIcon sx={{ fontSize: Math.round(size * 0.52) }} />
    </Box>
  );
}

export function Logo({ tone = "default", size = 40, showWordmark = true }: LogoProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <LogoTile tone={tone} size={size} />
      {showWordmark && (
        <Typography
          component="span"
          sx={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: tone === "onDark" ? colors.white : colors.ink,
          }}
        >
          ChatSphere
        </Typography>
      )}
    </Box>
  );
}
