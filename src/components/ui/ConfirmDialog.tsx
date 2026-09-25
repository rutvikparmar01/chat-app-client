import { Box, Dialog, Typography } from "@mui/material";
import { colors } from "../../theme";
import { DangerButton, GhostButton, PrimaryButton } from "./Buttons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  busy,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const Confirm = tone === "danger" ? DangerButton : PrimaryButton;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="confirm-title">
      <Box sx={{ p: 3.5 }}>
        <Typography id="confirm-title" variant="h6" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography sx={{ mt: 1, color: colors.textSecondary, fontSize: 14, lineHeight: "21px" }}>{description}</Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, mt: 3 }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Confirm onClick={onConfirm} disabled={busy} autoFocus>
            {confirmLabel}
          </Confirm>
        </Box>
      </Box>
    </Dialog>
  );
}
