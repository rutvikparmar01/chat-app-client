import { Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { colors } from "../../theme";
import { IconBtn } from "./IconBtn";

export function DialogHeader({ id, title, subtitle, onClose }: { id: string; title: string; subtitle?: string; onClose: () => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography id={id} variant="h5" component="h2">
          {title}
        </Typography>
        {subtitle && <Typography sx={{ mt: 0.5, fontSize: 14, color: colors.textSecondary }}>{subtitle}</Typography>}
      </Box>
      <IconBtn label="Close" icon={<CloseIcon />} onClick={onClose} size="small" />
    </Box>
  );
}
