import { useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";
import { GroupInfoPanel } from "../components/GroupInfoPanel";
import { useChat } from "../context/ChatContext";

export default function ChatPage() {
  const { activeThread } = useChat();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // Remember which group the panel was opened for, so switching threads closes it.
  const [membersFor, setMembersFor] = useState<string | null>(null);

  const group = activeThread?.isGroup ? activeThread : null;
  const membersOpen = !!group && membersFor === group.id;
  const toggleMembers = () => setMembersFor(membersOpen ? null : group?.id ?? null);
  const closeMembers = () => setMembersFor(null);

  if (isMobile) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
        {!activeThread ? (
          <Sidebar variant="mobile" />
        ) : group && membersOpen ? (
          <GroupInfoPanel group={group} onClose={closeMembers} variant="page" />
        ) : (
          <ChatWindow mobile membersOpen={false} onToggleMembers={toggleMembers} />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
      <Sidebar />
      <ChatWindow membersOpen={membersOpen && isDesktop} onToggleMembers={toggleMembers} />
      {group && isDesktop && membersOpen && <GroupInfoPanel group={group} onClose={closeMembers} />}
      {group && !isDesktop && (
        <Drawer anchor="right" open={membersOpen} onClose={closeMembers} slotProps={{ paper: { sx: { width: 340, maxWidth: "100%" } } }}>
          <GroupInfoPanel group={group} onClose={closeMembers} variant="drawer" />
        </Drawer>
      )}
    </Box>
  );
}
