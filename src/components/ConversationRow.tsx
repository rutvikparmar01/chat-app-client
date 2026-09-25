import { memo } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { colors, radii } from "../theme";
import { GroupAvatar, UnreadBadge, UserAvatar } from "./ui";
import { threadLabel, threadOtherUser, threadPreview } from "../utils/thread";
import { formatListTime } from "../utils/time";
import type { ChatThread } from "../types";

interface ConversationRowProps {
  thread: ChatThread;
  currentUserId?: string;
  active: boolean;
  online: boolean;
  typing: boolean;
  onSelect: (thread: ChatThread) => void;
}

export const ConversationRow = memo(function ConversationRow({
  thread,
  currentUserId,
  active,
  online,
  typing,
  onSelect,
}: ConversationRowProps) {
  const label = threadLabel(thread, currentUserId);
  const other = threadOtherUser(thread, currentUserId);
  // The open thread is marked read on view — show it as read immediately.
  const unread = active ? 0 : thread.unreadCount ?? 0;
  const hasUnread = unread > 0;
  const time = thread.lastMessage?.createdAt ?? thread.updatedAt;

  return (
    <ButtonBase
      onClick={() => onSelect(thread)}
      aria-current={active ? "true" : undefined}
      aria-label={`${label}${thread.isGroup ? " (group)" : ""}${hasUnread ? `, ${unread} unread` : ""}`}
      sx={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: `${radii.listItem}px`,
        textAlign: "left",
        bgcolor: active ? colors.softPrimaryBg : "transparent",
        "&:hover": { bgcolor: active ? colors.softPrimaryBg : colors.inputBg },
      }}
    >
      {active && (
        <Box aria-hidden sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 4, height: 32, borderRadius: "2px", bgcolor: colors.primary }} />
      )}
      {thread.isGroup ? (
        <GroupAvatar groupId={thread.id} size={48} />
      ) : (
        <UserAvatar
          name={label}
          userId={other?.id ?? thread.id}
          size={48}
          status={online ? "online" : "offline"}
          ringColor={active ? colors.softPrimaryBg : colors.paper}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 600, color: colors.ink, minWidth: 0 }}>
            {label}
          </Typography>
          {thread.isGroup && <PeopleOutlinedIcon aria-hidden sx={{ fontSize: 13, color: colors.muted, flexShrink: 0 }} />}
          <Typography
            component="span"
            sx={{
              ml: "auto",
              pl: 1,
              flexShrink: 0,
              fontSize: 12,
              fontWeight: hasUnread ? 600 : 500,
              color: hasUnread ? colors.primary : colors.muted,
            }}
          >
            {formatListTime(time)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: typing || hasUnread ? 500 : 400,
              color: typing ? colors.primary : hasUnread ? colors.label : colors.textSecondary,
            }}
          >
            {typing ? "typing…" : threadPreview(thread, currentUserId)}
          </Typography>
          <UnreadBadge count={unread} />
        </Box>
      </Box>
    </ButtonBase>
  );
});
