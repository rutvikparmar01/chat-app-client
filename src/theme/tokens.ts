/**
 * ChatSphere design tokens — the single source of truth for colors, gradients,
 * shadows and radii. Components import from here (or read the MUI theme);
 * no hex values should live anywhere else.
 */

export const colors = {
  primary: "#5B5BF7",
  primaryDark: "#4F46E5",
  violet: "#8B5CF6",
  indigo: "#6366F1",

  ink: "#0F172A",
  body: "#1E293B",
  textSecondary: "#64748B",
  muted: "#94A3B8",
  label: "#334155",
  slate600: "#475569",

  surface: "#F6F7FB",
  paper: "#FFFFFF",
  inputBg: "#F8FAFC",
  subtle: "#F1F5F9",

  border: "#E2E8F0",
  divider: "#E9ECF3",
  dividerSoft: "#EEF1F6",

  softPrimaryBg: "#EEF0FF",
  softPrimaryText: "#4F46E5",
  softPrimaryBorder: "#A5B4FC",
  selectedRowBg: "#F5F6FF",
  outgoingMeta: "#E0E7FF",
  /** Read receipt tick — light green so it reads on the gradient bubble. */
  readTick: "#86EFAC",
  toolbarBorder: "#EEF0F5",
  unreadLine: "rgba(91,91,247,.35)",

  success: "#22C55E",
  successText: "#16A34A",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerText: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",

  navRail: "#0E1225",
  navActiveBg: "rgba(99,102,241,.28)",
  navIcon: "rgba(255,255,255,.55)",
  navHoverBg: "rgba(255,255,255,.06)",

  white: "#FFFFFF",
  whiteA92: "rgba(255,255,255,.92)",
  whiteA80: "rgba(255,255,255,.8)",
  whiteA60: "rgba(255,255,255,.6)",
  whiteA24: "rgba(255,255,255,.24)",
  whiteA15: "rgba(255,255,255,.15)",
  whiteA70: "rgba(255,255,255,.7)",
  whiteA25: "rgba(255,255,255,.25)",
  whiteA16: "rgba(255,255,255,.16)",
  whiteA12: "rgba(255,255,255,.12)",
  whiteA08: "rgba(255,255,255,.08)",

  backdrop: "rgba(11,16,32,.55)",
  toastBg: "#0F172A",
} as const;

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary}, ${colors.violet})`,
  brandPanel: "linear-gradient(124.56deg, #4338CA 0%, #6D28D9 50%, #A21CAF 100%)",
  logo: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
  softPrimary: `linear-gradient(135deg, ${colors.softPrimaryBg}, #F5F0FF)`,
} as const;

export const avatarPalette = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
  "#EF4444",
  "#0EA5E9",
] as const;

export const shadows = {
  soft: "0 8px 24px rgba(15,23,42,.08)",
  card: "0 1px 2px rgba(15,23,42,.04), 0 4px 12px rgba(15,23,42,.04)",
  bubble: "0 1px 2px rgba(15,23,42,.06)",
  primaryButton: "0 8px 20px rgba(91,91,247,.25)",
  segment: "0 1px 3px rgba(15,23,42,.1)",
  focusRing: "0 0 0 4px rgba(99,102,241,.16)",
  hoverRing: "0 0 0 3px rgba(91,91,247,.35)",
  toolbar: "0 6px 18px rgba(15,23,51,.14)",
  incomingBubble: "0 2px 8px rgba(15,23,51,.06)",
  composer: "0 2px 10px rgba(15,23,51,.05)",
  sendButton: "0 6px 14px rgba(15,23,51,.3)",
  modal: "0 24px 64px rgba(15,23,42,.24)",
} as const;

export const radii = {
  input: 12,
  button: 12,
  navButton: 14,
  listItem: 14,
  toolbar: 14,
  card: 16,
  cardLg: 20,
  glass: 22,
  modal: 24,
  bubble: 18,
  bubbleTail: 6,
  pill: 999,
} as const;

export const fontFamily = '"Inter", system-ui, "Segoe UI", Roboto, sans-serif';

/** Deterministic palette index from any string id. */
function hashIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % avatarPalette.length;
}

export function avatarColor(id: string): string {
  return avatarPalette[hashIndex(id)];
}

export function avatarGradient(id: string, colorIndex?: number): string {
  const i = colorIndex ?? hashIndex(id);
  return `linear-gradient(135deg, ${avatarPalette[i]}, ${avatarPalette[(i + 3) % avatarPalette.length]})`;
}
