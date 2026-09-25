import { forwardRef } from "react";
import { Button, type ButtonProps } from "@mui/material";
import { colors } from "../../theme";

/** Gradient primary button — the theme's contained/primary variant. */
export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(function PrimaryButton(props, ref) {
  return <Button ref={ref} variant="contained" color="primary" {...props} />;
});

/** White button with a thin border. */
export const GhostButton = forwardRef<HTMLButtonElement, ButtonProps>(function GhostButton(props, ref) {
  return <Button ref={ref} variant="outlined" {...props} />;
});

/** Soft-primary fill with primary text. */
export const SoftButton = forwardRef<HTMLButtonElement, ButtonProps>(function SoftButton({ sx, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="text"
      sx={[
        {
          bgcolor: colors.softPrimaryBg,
          color: colors.softPrimaryText,
          "&:hover": { bgcolor: colors.softPrimaryBg, filter: "brightness(0.97)" },
          "&.Mui-disabled": { bgcolor: colors.subtle, color: colors.muted },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
});

/** Red soft button for destructive actions such as "Leave group". */
export const DangerButton = forwardRef<HTMLButtonElement, ButtonProps>(function DangerButton({ sx, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="outlined"
      sx={[
        {
          bgcolor: colors.dangerBg,
          borderColor: colors.dangerBorder,
          color: colors.dangerText,
          "&:hover": { bgcolor: colors.dangerBg, borderColor: colors.danger },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
});
