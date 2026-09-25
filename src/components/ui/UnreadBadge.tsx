import { Box } from "@mui/material";
import { colors, gradients, radii } from "../../theme";

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Box
      component="span"
      aria-label={`${count} unread`}
      sx={{
        minWidth: 20,
        height: 20,
        px: 0.75,
        borderRadius: `${radii.pill}px`,
        background: gradients.primary,
        color: colors.white,
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {count > 99 ? "99+" : count}
    </Box>
  );
}
