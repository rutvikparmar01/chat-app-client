import { forwardRef, type ReactNode } from "react";
import { IconButton, Tooltip, type IconButtonProps } from "@mui/material";
import { colors, radii } from "../../theme";

interface IconBtnProps extends Omit<IconButtonProps, "children" | "size"> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  size?: "small" | "medium";
  /** Tooltip text; defaults to `label`. Pass a reason when the button is disabled. */
  tooltip?: string;
}

export const IconBtn = forwardRef<HTMLButtonElement, IconBtnProps>(function IconBtn(
  { label, icon, active, size = "medium", tooltip, sx, ...rest },
  ref
) {
  const dim = size === "small" ? 32 : 40;
  return (
    <Tooltip title={tooltip ?? label}>
      {/* span keeps the tooltip working on disabled buttons */}
      <span style={{ display: "inline-flex" }}>
        <IconButton
          ref={ref}
          aria-label={label}
          aria-pressed={active}
          sx={[
            {
              width: dim,
              height: dim,
              borderRadius: `${radii.button}px`,
              bgcolor: active ? colors.softPrimaryBg : colors.inputBg,
              color: active ? colors.primary : colors.textSecondary,
              "& svg": { fontSize: size === "small" ? 18 : 20 },
              "&:hover": {
                bgcolor: active ? colors.softPrimaryBg : colors.subtle,
                color: active ? colors.primary : colors.ink,
              },
              "&.Mui-disabled": { color: colors.muted, opacity: 0.6 },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...rest}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
});
