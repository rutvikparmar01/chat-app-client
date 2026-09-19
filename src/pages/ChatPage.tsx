import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";
import { CreateGroupDialog } from "../components/CreateGroupDialog";
import { ChatProvider, useChat } from "../context/ChatContext";

function ChatLayout({ onCreateGroup }: { onCreateGroup: () => void }) {
  const { activeThread } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Sidebar onCreateGroup={onCreateGroup} />
        <ChatWindow />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      {activeThread ? <ChatWindow /> : <Sidebar onCreateGroup={onCreateGroup} />}
    </Box>
  );
}

export default function ChatPage() {
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  return (
    <ChatProvider>
      <ChatLayout onCreateGroup={() => setGroupDialogOpen(true)} />
      <CreateGroupDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} />
    </ChatProvider>
  );
}
