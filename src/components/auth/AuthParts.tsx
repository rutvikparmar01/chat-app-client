import type { ChangeEvent, ReactNode } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import { Link as RouterLink } from "react-router-dom";
import { colors, shadows } from "../../theme";
import { PrimaryButton } from "../ui";

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 1.5, pb: 0.5 }}>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 28, sm: 32 } }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 15, lineHeight: "22px", color: colors.textSecondary }}>{subtitle}</Typography>
    </Box>
  );
}

export function AuthSubmit({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <PrimaryButton
      type="submit"
      fullWidth
      disabled={loading}
      endIcon={loading ? undefined : <ArrowForwardIcon sx={{ fontSize: 18 }} />}
      sx={{ height: 52, fontSize: 15 }}
    >
      {loading ? <CircularProgress size={22} color="inherit" aria-label="Submitting" /> : children}
    </PrimaryButton>
  );
}

export function OrDivider() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }} role="separator">
      <Box sx={{ flex: 1, height: "1px", bgcolor: colors.border }} />
      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: colors.muted }}>OR</Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: colors.border }} />
    </Box>
  );
}

export function SwitchLink({ prompt, to, label }: { prompt: string; to: string; label: string }) {
  return (
    <Typography sx={{ textAlign: "center", fontSize: 14, color: colors.textSecondary }}>
      {prompt}{" "}
      <Box
        component={RouterLink}
        to={to}
        sx={{
          color: colors.primary,
          fontWeight: 600,
          textDecoration: "none",
          borderRadius: "4px",
          "&:hover": { textDecoration: "underline" },
          "&:focus-visible": { outline: `2px solid ${colors.indigo}`, outlineOffset: 2 },
        }}
      >
        {label}
      </Box>
    </Typography>
  );
}

/** 18px rounded checkbox matching the design (primary fill + white check). */
export function DesignCheckbox({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: ReactNode;
}) {
  return (
    <Box
      component="label"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.25,
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: colors.label,
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked)}
        sx={{ position: "absolute", opacity: 0, width: 0, height: 0, "&:focus-visible + span": { boxShadow: shadows.focusRing } }}
      />
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 18,
          height: 18,
          borderRadius: "5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: checked ? colors.primary : colors.paper,
          border: checked ? "none" : `1.5px solid ${colors.border}`,
          color: colors.white,
        }}
      >
        {checked && <CheckIcon sx={{ fontSize: 13 }} />}
      </Box>
      {label}
    </Box>
  );
}
