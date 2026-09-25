import { Outlet, useLocation } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { ChatProvider, useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { UiProvider, useUi } from "../../context/UiContext";
import { colors } from "../../theme";
import { NavRail } from "./NavRail";
import { BottomTabBar } from "./BottomTabBar";

function ShellLayout() {
  const { user, logout } = useAuth();
  const { threads, activeThread } = useChat();
  const { connected } = useSocket();
  const { openCreateGroup } = useUi();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // The open thread is marked read as soon as it's viewed, so don't count it.
  const unreadTotal = threads.reduce((sum, t) => sum + (t.id === activeThread?.id ? 0 : t.unreadCount ?? 0), 0);

  // On mobile an open chat is its own full screen, without the tab bar.
  const inMobileChat = isMobile && pathname.startsWith("/chat") && !!activeThread;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: colors.surface,
      }}
    >
      {!isMobile && user && (
        <NavRail
          unreadTotal={unreadTotal}
          onNewGroup={() => openCreateGroup()}
          onLogout={logout}
          user={user}
          online={connected}
        />
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
        <Outlet />
      </Box>
      {isMobile && !inMobileChat && user && (
        <BottomTabBar unreadTotal={unreadTotal} onLogout={logout} username={user.username} />
      )}
    </Box>
  );
}

export function AppShell() {
  return (
    <ChatProvider>
      <UiProvider>
        <ShellLayout />
      </UiProvider>
    </ChatProvider>
  );
}
