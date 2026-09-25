import type { ReactNode } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { colors, gradients, radii, shadows } from "../../theme";
import type { ConnectionStatus } from "../../context/SocketContext";
import { BubbleSkeleton, GhostButton, SoftButton } from "../ui";

export function ConnectionBanner({ status, attempt, onRetry }: { status: ConnectionStatus; attempt: number; onRetry: () => void }) {
  if (status === "connected" || status === "connecting") return null;
  const detail =
    status === "reconnecting"
      ? attempt > 0
        ? `Reconnecting… (attempt ${attempt})`
        : "Reconnecting…"
      : "Messages won't send until you're back online.";
  return (
    <Box
      role="alert"
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mx: { xs: 1.5, md: 4 },
        mt: 1.5,
        px: 2,
        py: 1.25,
        borderRadius: `${radii.toolbar}px`,
        bgcolor: colors.dangerBg,
        border: `1px solid ${colors.dangerBorder}`,
      }}
    >
      <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: colors.paper, color: colors.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <WifiOffIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.dangerText }}>Connection lost</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.danger }}>{detail}</Typography>
      </Box>
      <ButtonBase
        onClick={onRetry}
        sx={{ px: 1.5, height: 32, borderRadius: "10px", bgcolor: colors.paper, border: `1px solid ${colors.dangerBorder}`, color: colors.dangerText, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
      >
        Retry now
      </ButtonBase>
    </Box>
  );
}

export function ChatSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading messages" sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: "auto" }}>
      <BubbleSkeleton width={320} />
      <BubbleSkeleton width={220} />
      <BubbleSkeleton own width={360} />
      <BubbleSkeleton width={260} />
      <BubbleSkeleton own width={200} />
    </Box>
  );
}

export function EmptyChat({ name, starters, onPick }: { name: string; starters: string[]; onPick: (text: string) => void }) {
  return (
    <Box sx={{ m: "auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1, maxWidth: 320, py: 4 }}>
      <Box aria-hidden sx={{ width: 112, height: 112, borderRadius: "50%", background: gradients.softPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, mb: 1.5 }}>
        👋
      </Box>
      <Typography variant="h6" component="p">
        No messages yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.textSecondary, lineHeight: "21px" }}>Say hi to {name} and start the conversation.</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1, mt: 1.5 }}>
        {starters.map((s) => (
          <ButtonBase
            key={s}
            onClick={() => onPick(s)}
            sx={{ px: 1.75, height: 34, borderRadius: `${radii.pill}px`, bgcolor: colors.paper, border: `1px solid ${colors.border}`, fontSize: 13, fontWeight: 500, color: colors.label, "&:hover": { borderColor: colors.softPrimaryBorder, bgcolor: colors.softPrimaryBg } }}
          >
            {s}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

function StateCard({ icon, iconBg, iconColor, title, detail, action }: { icon: ReactNode; iconBg: string; iconColor: string; title: string; detail: string; action: ReactNode }) {
  return (
    <Box
      role="alert"
      sx={{
        m: "auto",
        width: "100%",
        maxWidth: 380,
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        bgcolor: colors.paper,
        borderRadius: `${radii.cardLg}px`,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.card,
      }}
    >
      <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>{icon}</Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, lineHeight: "19px", mb: 1 }}>{detail}</Typography>
      {action}
    </Box>
  );
}

export function HistoryErrorCard({ detail, onRetry }: { detail: string; onRetry: () => void }) {
  return (
    <StateCard
      icon={<WarningAmberRoundedIcon />}
      iconBg={colors.dangerBg}
      iconColor={colors.warning}
      title="Couldn't load chat history"
      detail={detail}
      action={
        <SoftButton size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
          Try again
        </SoftButton>
      }
    />
  );
}

export function ForbiddenCard({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <StateCard
      icon={<LockOutlinedIcon />}
      iconBg={colors.softPrimaryBg}
      iconColor={colors.primary}
      title="You're not a member of this group"
      detail={`403 · Only members can view or send messages in “${name}”.`}
      action={
        <GhostButton size="small" onClick={onBack}>
          Back to chats
        </GhostButton>
      }
    />
  );
}

export function DatePill({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
      <Box sx={{ px: 1.75, py: 0.625, borderRadius: `${radii.pill}px`, bgcolor: colors.paper, border: `1px solid ${colors.divider}`, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>{label}</Box>
    </Box>
  );
}

export function UnreadDivider({ count }: { count: number }) {
  return (
    <Box role="separator" aria-label={`${count} new messages`} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
      <Box sx={{ flex: 1, height: "1px", bgcolor: colors.unreadLine }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: `${radii.pill}px`, bgcolor: colors.softPrimaryBg, color: colors.softPrimaryText, fontSize: 12, fontWeight: 600 }}>
        <ArrowDownwardIcon sx={{ fontSize: 13 }} />
        {count} new {count === 1 ? "message" : "messages"}
      </Box>
      <Box sx={{ flex: 1, height: "1px", bgcolor: colors.unreadLine }} />
    </Box>
  );
}
