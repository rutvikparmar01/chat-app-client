import { Box } from "@mui/material";
import { colors, radii, shadows } from "../../theme";

/** Three animated dots in a white pill — the typing indicator bubble. */
export function TypingDots({ dotColor = colors.primary, bg = colors.paper }: { dotColor?: string; bg?: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: 1.75,
        height: 31,
        borderRadius: `${radii.card}px`,
        bgcolor: bg,
        boxShadow: bg === colors.paper ? shadows.bubble : "none",
        flexShrink: 0,
      }}
    >
      {[1, 0.65, 0.35].map((opacity, i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: dotColor,
            opacity,
            animation: "cs-typing 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      ))}
    </Box>
  );
}
