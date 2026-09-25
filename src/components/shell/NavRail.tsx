import type { ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, ButtonBase, Tooltip } from "@mui/material";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { colors, gradients, radii } from "../../theme";
import { UserAvatar } from "../ui";

interface RailButtonProps {
  label: string;
  icon: ReactNode;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  badge?: number;
  onClick?: () => void;
}

function RailButton({ label, icon, to, active, disabled, tooltip, badge, onClick }: RailButtonProps) {
  const linkProps = to && !disabled ? { component: RouterLink, to } : {};
  return (
    <Tooltip title={tooltip ?? label} placement="right">
      <span style={{ display: "inline-flex" }}>
        <ButtonBase
          {...linkProps}
          onClick={onClick}
          disabled={disabled}
          aria-label={badge ? `${label}, ${badge} unread` : label}
          aria-current={active ? "page" : undefined}
          sx={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: `${radii.navButton}px`,
            color: active ? colors.white : colors.navIcon,
            bgcolor: active ? colors.navActiveBg : "transparent",
            "& svg": { fontSize: 22 },
            "&:hover": { bgcolor: active ? colors.navActiveBg : colors.navHoverBg, color: colors.white },
            "&.Mui-disabled": { color: colors.navIcon, opacity: 0.45 },
          }}
        >
          {icon}
          {!!badge && badge > 0 && (
            <Box
              component="span"
              aria-hidden
              sx={{
                position: "absolute",
                left: 30,
                top: 2,
                px: "5px",
                py: "1px",
                minWidth: 18,
                borderRadius: `${radii.pill}px`,
                bgcolor: colors.danger,
                border: `2px solid ${colors.navRail}`,
                color: colors.white,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: "14px",
                textAlign: "center",
              }}
            >
              {badge > 99 ? "99+" : badge}
            </Box>
          )}
        </ButtonBase>
      </span>
    </Tooltip>
  );
}

interface NavRailProps {
  unreadTotal: number;
  onNewGroup: () => void;
  onLogout: () => void;
  user: { id: string; username: string };
  online: boolean;
}

export function NavRail({ unreadTotal, onNewGroup, onLogout, user, online }: NavRailProps) {
  const { pathname } = useLocation();
  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        width: 84,
        flexShrink: 0,
        height: "100%",
        bgcolor: colors.navRail,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2.5,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 44,
            height: 44,
            borderRadius: `${radii.navButton}px`,
            background: gradients.logo,
            color: colors.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChatBubbleOutlinedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
          <RailButton label="Chats" icon={<ChatBubbleOutlinedIcon />} to="/chat" active={pathname.startsWith("/chat")} badge={unreadTotal} />
          <RailButton label="People" icon={<PeopleOutlinedIcon />} to="/people" active={pathname.startsWith("/people")} />
          <RailButton label="New group" icon={<PersonAddAltIcon />} onClick={onNewGroup} />
          <RailButton label="Notifications" icon={<NotificationsNoneIcon />} disabled tooltip="Notifications — coming soon" />
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <RailButton label="Settings" icon={<SettingsIcon />} disabled tooltip="Settings — coming soon" />
        <RailButton label="Log out" icon={<LogoutIcon />} onClick={onLogout} />
        <Tooltip title={`${user.username} · ${online ? "Online" : "Offline"}`} placement="right">
          <Box tabIndex={0} aria-label={`Signed in as ${user.username}`} sx={{ borderRadius: "50%", "&:focus-visible": { outline: `2px solid ${colors.indigo}`, outlineOffset: 2 } }}>
            <UserAvatar name={user.username} userId={user.id} size={40} status={online ? "online" : "offline"} ringColor={colors.navRail} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
