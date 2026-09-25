import { useState, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { colors, radii } from "../../theme";

interface TabProps {
  label: string;
  icon: ReactNode;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  onClick?: (el: HTMLElement) => void;
}

function Tab({ label, icon, to, active, disabled, badge, onClick }: TabProps) {
  const linkProps = to ? { component: RouterLink, to } : {};
  return (
    <ButtonBase
      {...linkProps}
      disabled={disabled}
      onClick={(e) => onClick?.(e.currentTarget)}
      aria-current={active ? "page" : undefined}
      aria-label={disabled ? `${label} (coming soon)` : label}
      sx={{
        flex: 1,
        height: 56,
        flexDirection: "column",
        gap: 0.25,
        borderRadius: `${radii.button}px`,
        color: active ? colors.primary : colors.muted,
        "&.Mui-disabled": { opacity: 0.5 },
      }}
    >
      <Box sx={{ position: "relative", display: "flex", "& svg": { fontSize: 22 } }}>
        {icon}
        {!!badge && badge > 0 && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: -4,
              left: 14,
              px: "5px",
              minWidth: 16,
              borderRadius: `${radii.pill}px`,
              bgcolor: colors.danger,
              border: `2px solid ${colors.paper}`,
              color: colors.white,
              fontSize: 9,
              fontWeight: 700,
              lineHeight: "12px",
              textAlign: "center",
            }}
          >
            {badge > 99 ? "99+" : badge}
          </Box>
        )}
      </Box>
      <Typography component="span" sx={{ fontSize: 11, fontWeight: active ? 600 : 500 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}

export function BottomTabBar({ unreadTotal, onLogout, username }: { unreadTotal: number; onLogout: () => void; username: string }) {
  const { pathname } = useLocation();
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        flexShrink: 0,
        display: "flex",
        px: 1,
        pb: "env(safe-area-inset-bottom)",
        bgcolor: colors.paper,
        borderTop: `1px solid ${colors.divider}`,
      }}
    >
      <Tab label="Chats" icon={<ChatBubbleOutlinedIcon />} to="/chat" active={pathname.startsWith("/chat")} badge={unreadTotal} />
      <Tab label="People" icon={<PeopleOutlinedIcon />} to="/people" active={pathname.startsWith("/people")} />
      <Tab label="Activity" icon={<NotificationsNoneIcon />} disabled />
      <Tab label="Profile" icon={<PersonOutlinedIcon />} active={!!profileAnchor} onClick={setProfileAnchor} />
      <Menu
        anchorEl={profileAnchor}
        open={!!profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem disabled sx={{ opacity: "1 !important", fontWeight: 600 }}>
          {username}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            onLogout();
          }}
          sx={{ color: colors.dangerText, gap: 1 }}
        >
          <LogoutIcon sx={{ fontSize: 18 }} /> Log out
        </MenuItem>
      </Menu>
    </Box>
  );
}
