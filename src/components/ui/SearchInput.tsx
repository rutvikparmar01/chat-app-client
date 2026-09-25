import { useEffect, useRef } from "react";
import { Box, InputBase, type SxProps, type Theme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { colors, radii, shadows } from "../../theme";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  height?: number;
  /** "filled" is the grey sidebar style; "outlined" the white one with a border. */
  variant?: "filled" | "outlined";
  autoFocus?: boolean;
  sx?: SxProps<Theme>;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  hint,
  height = 44,
  variant = "filled",
  autoFocus,
  sx,
}: SearchInputProps) {
  const filled = variant === "filled";
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The ⌘K / Ctrl+K hint is a real shortcut: it focuses this field.
  useEffect(() => {
    if (!hint) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hint]);
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: 1,
          height,
          px: 1.5,
          borderRadius: `${radii.input}px`,
          bgcolor: filled ? colors.subtle : colors.paper,
          border: `1px solid ${filled ? "transparent" : colors.border}`,
          transition: "box-shadow .15s, border-color .15s, background-color .15s",
          "&:focus-within": {
            bgcolor: colors.paper,
            borderColor: colors.indigo,
            boxShadow: shadows.focusRing,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <SearchIcon sx={{ fontSize: 20, color: colors.muted }} />
      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        slotProps={{ input: { "aria-label": placeholder } }}
        sx={{
          flex: 1,
          fontSize: 14,
          color: colors.ink,
          "& input::placeholder": { color: colors.muted, opacity: 1 },
        }}
      />
      {hint && (
        <Box
          component="kbd"
          sx={{
            fontFamily: "inherit",
            fontSize: 11,
            fontWeight: 600,
            color: colors.textSecondary,
            bgcolor: colors.paper,
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
            px: 0.75,
            py: 0.25,
          }}
        >
          {hint}
        </Box>
      )}
    </Box>
  );
}
