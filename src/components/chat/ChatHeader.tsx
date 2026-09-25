import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SearchIcon from "@mui/icons-material/Search";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { colors } from "../../theme";
import { presenceLabel } from "../../utils/time";
import { GroupAvatar, IconBtn, UserAvatar } from "../ui";
import type { ChatThread, User } from "../../types";

const SOON = "Coming soon";

interface ChatHeaderProps {
  thread: ChatThread;
  title: string;
  otherUser?: User;
  otherOnline: boolean;
  otherLastSeen?: string;
  typing: boolean;
  onlineMemberCount: number;
  membersOpen: boolean;
  onToggleMembers: () => void;
  onBack?: () => void;
  compact?: boolean;
}

export function ChatHeader({
  thread,
  title,
  otherUser,
  otherOnline,
  otherLastSeen,
  typing,
  onlineMemberCount,
  membersOpen,
  onToggleMembers,
  onBack,
  compact,
}: ChatHeaderProps) {
  let subtitle: { text: string; color: string; dot?: string };
  if (typing) subtitle = { text: "typing…", color: colors.primary, dot: colors.success };
  else if (thread.isGroup) subtitle = { text: `${thread.members.length} members · ${onlineMemberCount} online`, color: colors.textSecondary };
  else if (otherOnline) subtitle = { text: "Online", color: colors.successText, dot: colors.success };
  else subtitle = { text: presenceLabel(false, otherLastSeen), color: colors.textSecondary };

  const identity = (
    <>
      {thread.isGroup ? (
        <GroupAvatar groupId={thread.id} size={44} />
      ) : (
        <UserAvatar name={title} userId={otherUser?.id ?? thread.id} size={44} status={otherOnline ? "online" : "offline"} />
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.375, textAlign: "left" }}>
        <Typography noWrap component="h2" sx={{ fontSize: 17, fontWeight: 600, color: colors.ink }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }} aria-live="polite">
          {subtitle.dot && <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: subtitle.dot, flexShrink: 0 }} />}
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: subtitle.color }}>
            {subtitle.text}
          </Typography>
        </Box>
      </Box>
    </>
  );

  return (
    <Box
      component="header"
      sx={{
        height: compact ? 64 : 76,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: compact ? 1 : 1.75,
        px: compact ? 1.5 : 3.5,
        bgcolor: colors.paper,
        borderBottom: `1px solid ${colors.divider}`,
      }}
    >
      {onBack && (
        <IconBtn label="Back to chats" icon={<ChevronLeftIcon />} onClick={onBack} sx={{ bgcolor: "transparent" }} />
      )}
      {thread.isGroup ? (
        <ButtonBase
          onClick={onToggleMembers}
          aria-label={`${title} — group info`}
          sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: compact ? 1.25 : 1.75, justifyContent: "flex-start", borderRadius: "12px" }}
        >
          {identity}
        </ButtonBase>
      ) : (
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: compact ? 1.25 : 1.75 }}>{identity}</Box>
      )}
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {!compact && <IconBtn label="Search in chat" tooltip={`Search in chat — ${SOON}`} icon={<SearchIcon />} disabled />}
        <IconBtn label="Voice call" tooltip={`Voice call — ${SOON}`} icon={<CallIcon />} disabled />
        {!compact && <IconBtn label="Video call" tooltip={`Video call — ${SOON}`} icon={<VideocamIcon />} disabled />}
        {thread.isGroup ? (
          <IconBtn label={membersOpen ? "Hide group info" : "Show group info"} icon={<PeopleOutlinedIcon />} active={membersOpen} onClick={onToggleMembers} />
        ) : (
          !compact && <IconBtn label="Contact info" tooltip={`Contact info — ${SOON}`} icon={<InfoOutlinedIcon />} disabled />
        )}
      </Box>
    </Box>
  );
}
