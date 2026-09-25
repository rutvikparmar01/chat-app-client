import { Box } from "@mui/material";
import { colors, radii } from "../../theme";
import { presenceLabel } from "../../utils/time";

export function StatusPill({ online, lastSeen }: { online: boolean; lastSeen?: string | null }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        height: 24,
        borderRadius: `${radii.pill}px`,
        bgcolor: online ? colors.successBg : colors.subtle,
        color: online ? colors.successText : colors.textSecondary,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: online ? colors.success : colors.muted }} />
      {presenceLabel(online, lastSeen)}
    </Box>
  );
}
