import { createTheme } from "@mui/material/styles";
import { colors, fontFamily, gradients, radii, shadows } from "./tokens";

export * from "./tokens";

const focusVisible = {
  outline: "none",
  boxShadow: shadows.focusRing,
};

export const theme = createTheme({
  palette: {
    primary: { main: colors.primary, dark: colors.primaryDark, contrastText: colors.white },
    secondary: { main: colors.violet, contrastText: colors.white },
    success: { main: colors.success, dark: colors.successText, light: colors.successBg },
    warning: { main: colors.warning },
    error: { main: colors.danger, dark: colors.dangerText, light: colors.dangerBg },
    text: { primary: colors.ink, secondary: colors.textSecondary, disabled: colors.muted },
    background: { default: colors.surface, paper: colors.paper },
    divider: colors.divider,
  },
  shape: { borderRadius: radii.input },
  typography: {
    fontFamily,
    h1: { fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 },
    h2: { fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h3: { fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25 },
    h4: { fontSize: 24, fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: 22, fontWeight: 700, lineHeight: 1.3 },
    h6: { fontSize: 18, fontWeight: 700, lineHeight: 1.35 },
    subtitle1: { fontSize: 17, fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 14, fontWeight: 400, lineHeight: "21px" },
    body2: { fontSize: 13, fontWeight: 400, lineHeight: "19px" },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4 },
    overline: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.4 },
    button: { fontSize: 14, fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.surface, color: colors.ink },
        "@keyframes cs-spin": { to: { transform: "rotate(360deg)" } },
        "@keyframes cs-typing": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-3px)" },
        },
      },
    },  
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { "&.Mui-focusVisible": focusVisible } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            background: gradients.primary,
            boxShadow: shadows.primaryButton,
            "&:hover": { background: gradients.primary, boxShadow: shadows.primaryButton, filter: "brightness(1.05)" },
            "&.Mui-disabled": { background: colors.border, color: colors.muted, boxShadow: "none" },
          },
        },
      ],
      styleOverrides: {
        root: {
          borderRadius: radii.button,
          height: 44,
          paddingInline: 18,
          fontWeight: 600,
          "&.Mui-focusVisible": focusVisible,
        },
        sizeSmall: { height: 34, paddingInline: 12, fontSize: 13 },
        sizeLarge: { height: 50, fontSize: 15 },
        outlined: {
          borderColor: colors.border,
          color: colors.label,
          backgroundColor: colors.paper,
          "&:hover": { borderColor: colors.muted, backgroundColor: colors.inputBg },
        },
        text: { "&:hover": { backgroundColor: colors.softPrimaryBg } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: radii.button, "&.Mui-focusVisible": focusVisible },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.input,
          backgroundColor: colors.inputBg,
          fontSize: 14,
          transition: "box-shadow .15s, background-color .15s",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border, borderWidth: 1 },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.muted },
          "&.Mui-focused": { backgroundColor: colors.paper, boxShadow: shadows.focusRing },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.indigo, borderWidth: 1.5 },
          "&.Mui-error": { backgroundColor: colors.dangerBg },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: colors.danger },
        },
        input: { "&::placeholder": { color: colors.muted, opacity: 1 } },
        notchedOutline: { "& legend": { display: "none" }, top: 0 },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 0, fontSize: 12, fontWeight: 500 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radii.modal, boxShadow: shadows.modal, backgroundImage: "none" },
      },
      defaultProps: {
        slotProps: {
          backdrop: { sx: { backgroundColor: colors.backdrop, backdropFilter: "blur(6px)" } },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radii.pill, fontWeight: 500, fontSize: 13 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: 11 },
        colorPrimary: { background: gradients.primary },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { backgroundColor: colors.ink, fontSize: 12, fontWeight: 500, borderRadius: 8, padding: "6px 10px" },
        arrow: { color: colors.ink },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: radii.card } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: radii.toolbar, boxShadow: shadows.soft, border: `1px solid ${colors.border}` },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: 14, borderRadius: 8, marginInline: 6 } },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { backgroundColor: colors.toastBg, borderRadius: radii.toolbar, fontSize: 14, fontWeight: 500 },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: { root: { backgroundColor: colors.dividerSoft } },
    },
    MuiCheckbox: {
      styleOverrides: { root: { color: colors.muted, "&.Mui-checked": { color: colors.primary } } },
    },
  },
});
