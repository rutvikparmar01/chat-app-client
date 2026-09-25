import { useId, useState, type ReactNode } from "react";
import { Box, IconButton, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { colors } from "../../theme";

interface AuthFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
  autoFocus?: boolean;
  children?: ReactNode;
}

export function AuthField({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  autoFocus,
  children,
}: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="label" htmlFor={id} sx={{ fontSize: 13, fontWeight: 600, color: colors.label }}>
        {label}
      </Typography>
      <OutlinedInput
        id={id}
        fullWidth
        type={isPassword && reveal ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        error={!!error}
        aria-describedby={error ? errorId : undefined}
        sx={{
          height: 50,
          fontWeight: 500,
          color: colors.ink,
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderWidth: 1.5 },
          "& .MuiInputAdornment-root": { color: error ? colors.danger : colors.muted },
          "&.Mui-focused .MuiInputAdornment-positionStart": { color: colors.indigo },
        }}
        startAdornment={
          <InputAdornment position="start" sx={{ "& svg": { fontSize: 18 } }}>
            {icon}
          </InputAdornment>
        }
        endAdornment={
          isPassword ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label={reveal ? "Hide password" : "Show password"}
                onClick={() => setReveal((r) => !r)}
                sx={{ color: colors.muted, "& svg": { fontSize: 18 } }}
              >
                {reveal ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      />
      {error && (
        <Box id={errorId} role="alert" sx={{ display: "flex", alignItems: "center", gap: 0.75, color: colors.danger }}>
          <ErrorOutlinedIcon sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{error}</Typography>
        </Box>
      )}
      {children}
    </Box>
  );
}
