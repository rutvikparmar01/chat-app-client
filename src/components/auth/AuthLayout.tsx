import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { colors, gradients, radii } from "../../theme";
import { Logo, TypingDots, UserAvatar } from "../ui";

const FEATURES = [
  { icon: ChatBubbleOutlinedIcon, label: "Instant 1:1 & group conversations" },
  { icon: PeopleOutlinedIcon, label: "Live presence & typing indicators" },
  { icon: ShieldOutlinedIcon, label: "JWT-secured, member-only access" },
];

function PreviewCard() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 440,
        maxWidth: "100%",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        bgcolor: colors.whiteA12,
        border: `1px solid ${colors.whiteA25}`,
        borderRadius: `${radii.glass}px`,
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.25 }}>
        <UserAvatar name="Aarav Kapoor" userId="preview-ak" colorIndex={1} size={32} status="online" ringColor={colors.white} />
        <Box sx={{ bgcolor: colors.paper, color: colors.ink, px: 1.75, py: 1.25, borderRadius: `${radii.card}px`, fontSize: 13, fontWeight: 500 }}>
          Did you push the socket fix? 🚀
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Box sx={{ bgcolor: colors.whiteA24, color: colors.white, px: 1.75, py: 1.25, borderRadius: `${radii.card}px`, fontSize: 13, fontWeight: 500 }}>
          Yes! Typing indicators are live now ⚡
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <UserAvatar name="Meera Patel" userId="preview-mp" colorIndex={3} size={32} status="online" ringColor={colors.white} />
        <TypingDots />
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.whiteA80 }}>Meera is typing…</Typography>
      </Box>
    </Box>
  );
}

function BrandPanel({ headline, subtitle }: { headline: string; subtitle: string }) {
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "flex" },
        width: { md: 460, lg: 620 },
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 4,
        p: { md: 5, lg: 7 },
        background: gradients.brandPanel,
        color: colors.white,
      }}
    >
      {/* decorative circles */}
      <Box aria-hidden sx={{ position: "absolute", left: 330, top: -160, width: 420, height: 420, borderRadius: "50%", bgcolor: colors.whiteA08 }} />
      <Box aria-hidden sx={{ position: "absolute", left: -90, top: 640, width: 260, height: 260, borderRadius: "50%", bgcolor: colors.whiteA08 }} />

      <Box sx={{ position: "relative" }}>
        <Logo tone="onDark" />
      </Box>

      <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3.25 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.75,
            py: 0.875,
            borderRadius: `${radii.pill}px`,
            bgcolor: colors.whiteA15,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <BoltIcon sx={{ fontSize: 14 }} />
          Real-time messaging, reimagined
        </Box>
        <Typography variant="h1" component="h2" sx={{ color: colors.white, maxWidth: 500, lineHeight: "54px", letterSpacing: "-0.025em" }}>
          {headline}
        </Typography>
        <Typography sx={{ fontSize: 16, lineHeight: "25px", color: colors.whiteA80, maxWidth: 470 }}>{subtitle}</Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.75 }}>
          {FEATURES.map(({ icon: Icon, label }) => (
            <Box component="li" key={label} sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: colors.whiteA16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: colors.whiteA92 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
        <PreviewCard />
      </Box>

      <Typography sx={{ position: "relative", fontSize: 13, fontWeight: 500, color: colors.whiteA60 }}>
        © 2026 ChatSphere · Practical assignment for AIPXperts
      </Typography>
    </Box>
  );
}

export function AuthLayout({
  headline,
  subtitle,
  maxWidth,
  children,
}: {
  headline: string;
  subtitle: string;
  maxWidth: number;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: colors.paper }}>
      <BrandPanel headline={headline} subtitle={subtitle} />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 5,
        }}
      >
        <Box sx={{ width: "100%", maxWidth, my: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
