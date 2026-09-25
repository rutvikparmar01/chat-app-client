import { Box, ButtonBase, type SxProps, type Theme } from "@mui/material";
import { colors, radii, shadows } from "../../theme";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Optional status dot before the label (e.g. green for "Online"). */
  dot?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  sx?: SxProps<Theme>;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel, sx }: SegmentedProps<T>) {
  return (
    <Box
      role="tablist"
      aria-label={ariaLabel}
      sx={[
        { display: "flex", gap: 0.5, p: 0.5, borderRadius: `${radii.button}px`, bgcolor: colors.subtle },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <ButtonBase
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            sx={{
              flex: 1,
              minWidth: 0,
              height: 34,
              px: 1.5,
              gap: 0.75,
              borderRadius: "10px",
              whiteSpace: "nowrap",
              fontSize: 13,
              fontWeight: 600,
              color: active ? colors.ink : colors.textSecondary,
              bgcolor: active ? colors.paper : "transparent",
              boxShadow: active ? shadows.segment : "none",
              transition: "background-color .15s, box-shadow .15s",
              "&:hover": { color: colors.ink },
            }}
          >
            {opt.dot && <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: opt.dot }} />}
            {opt.label}
            {opt.count !== undefined && (
              <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color: active ? colors.primary : colors.muted }}>
                {opt.count}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
