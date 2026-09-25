import { memo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Box, ButtonBase, InputBase, Popover, Tooltip, Typography } from "@mui/material";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import BlockIcon from "@mui/icons-material/Block";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import type { Message } from "../types";
import { avatarColor, colors, gradients, radii, shadows } from "../theme";
import { formatClock } from "../utils/time";
import { ConfirmDialog, GhostButton, PrimaryButton, UserAvatar } from "./ui";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉"];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  resolveUsername: (userId: string) => string;
  /** Group chats show sender name + avatar on the first message of a run. */
  isGroup?: boolean;
  firstOfRun?: boolean;
  maxWidth?: number;
  /** Outgoing only: "read" once every other participant has read it, else "sent". */
  readState?: "sent" | "read";
}

function ToolbarButton({ label, onClick, children, tone }: { label: string; onClick: (el: HTMLElement) => void; children: ReactNode; tone?: "danger" | "soft" }) {
  return (
    <Tooltip title={label}>
      <ButtonBase
        aria-label={label}
        onClick={(e) => onClick(e.currentTarget)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "9px",
          fontSize: 17,
          color: tone === "danger" ? colors.danger : colors.textSecondary,
          bgcolor: tone === "danger" ? colors.dangerBg : tone === "soft" ? colors.subtle : "transparent",
          "& svg": { fontSize: 17 },
          "&:hover": { bgcolor: tone === "danger" ? colors.dangerBorder : colors.subtle },
        }}
      >
        {children}
      </ButtonBase>
    </Tooltip>
  );
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  resolveUsername,
  isGroup,
  firstOfRun = true,
  maxWidth = 460,
  readState,
}: MessageBubbleProps) {
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reactionCounts = new Map<string, { count: number; mine: boolean; names: string[] }>();
  for (const reaction of message.reactions ?? []) {
    const entry = reactionCounts.get(reaction.emoji) ?? { count: 0, mine: false, names: [] };
    entry.count += 1;
    if (reaction.userId === currentUserId) entry.mine = true;
    entry.names.push(reaction.userId === currentUserId ? "You" : resolveUsername(reaction.userId));
    reactionCounts.set(reaction.emoji, entry);
  }

  function handleFullPickerPick(emojiData: EmojiClickData) {
    onReact(message.id, emojiData.emoji);
    setPickerAnchor(null);
  }

  function startEdit() {
    setDraft(message.content);
    setEditing(true);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setEditing(false);
  }

  function handleRowKeyDown(e: KeyboardEvent) {
    // Esc dismisses the keyboard-revealed hover toolbar.
    if (e.key === "Escape" && !editing && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  const senderName = message.sender.username;
  const showGroupChrome = isGroup && !isOwn;
  const bubbleRadius = {
    borderRadius: `${radii.bubble}px`,
    [isOwn ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: `${radii.bubbleTail}px`,
  };
  const metaColor = isOwn ? colors.outgoingMeta : colors.muted;
  const canAct = !message.deleted && !editing;

  const bubble = message.deleted ? (
    <Box sx={{ ...bubbleRadius, bgcolor: colors.dividerSoft, px: 1.75, pt: 1.25, pb: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: colors.muted }}>
        <BlockIcon sx={{ fontSize: 15 }} />
        <Typography sx={{ fontSize: 14, fontStyle: "italic", color: colors.muted }}>This message was deleted</Typography>
      </Box>
      <Typography sx={{ alignSelf: "flex-end", fontSize: 11, fontWeight: 500, color: colors.muted }}>{formatClock(message.createdAt)}</Typography>
    </Box>
  ) : editing ? (
    <Box sx={{ ...bubbleRadius, bgcolor: colors.paper, border: `1.5px solid ${colors.indigo}`, boxShadow: shadows.focusRing, p: 1.25, width: maxWidth, maxWidth: "100%" }}>
      <InputBase
        multiline
        maxRows={6}
        fullWidth
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          const len = e.target.value.length;
          e.target.setSelectionRange(len, len);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            setEditing(false);
          }
        }}
        inputProps={{ "aria-label": "Edit message" }}
        sx={{ fontSize: 14, lineHeight: "21px", px: 0.5, color: colors.body }}
      />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1, mt: 1 }}>
        <Typography sx={{ fontSize: 11, color: colors.muted, mr: "auto", pl: 0.5 }}>Esc to cancel · Enter to save</Typography>
        <GhostButton size="small" onClick={() => setEditing(false)}>
          Cancel
        </GhostButton>
        <PrimaryButton size="small" onClick={saveEdit} disabled={!draft.trim()}>
          Save
        </PrimaryButton>
      </Box>
    </Box>
  ) : (
    <Box
      className="msg-bubble"
      sx={{
        ...bubbleRadius,
        px: 1.75,
        pt: 1.25,
        pb: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        background: isOwn ? gradients.primary : colors.paper,
        color: isOwn ? colors.white : colors.body,
        boxShadow: isOwn ? "none" : shadows.incomingBubble,
        transition: "box-shadow .15s",
      }}
    >
      <Typography sx={{ fontSize: 14, lineHeight: "21px", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "inherit" }}>
        {message.content}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.625, color: metaColor }}>
        {message.edited && <Typography sx={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>Edited ·</Typography>}
        <Typography component="time" dateTime={message.createdAt} sx={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>
          {formatClock(message.createdAt)}
        </Typography>
        {isOwn &&
          (readState === "read" ? (
            <DoneAllIcon aria-label="Read" sx={{ fontSize: 15, color: colors.readTick }} />
          ) : (
            <DoneIcon aria-label="Sent" sx={{ fontSize: 15, color: "inherit" }} />
          ))}
      </Box>
    </Box>
  );

  return (
    <Box
      className="msg-row"
      onKeyDown={handleRowKeyDown}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        gap: 1.25,
        "&:hover .msg-toolbar, &:focus-within .msg-toolbar": { opacity: 1, pointerEvents: "auto", transform: "translateY(0)" },
        "&:hover .msg-bubble, &:focus-within .msg-bubble": { boxShadow: shadows.hoverRing },
      }}
    >
      {showGroupChrome &&
        (firstOfRun ? (
          <Box sx={{ alignSelf: "flex-end", mb: reactionCounts.size > 0 ? "31px" : 0 }}>
            <UserAvatar name={senderName} userId={message.sender.id} size={32} />
          </Box>
        ) : (
          <Box aria-hidden sx={{ width: 32, flexShrink: 0 }} />
        ))}

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", gap: 0.625, maxWidth: `min(${maxWidth}px, 82%)`, minWidth: 0 }}>
        {showGroupChrome && firstOfRun && (
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: avatarColor(message.sender.id), px: 0.5 }}>{senderName}</Typography>
        )}

        <Box sx={{ position: "relative", maxWidth: "100%" }}>
          {canAct && (
            <Box
              className="msg-toolbar"
              role="toolbar"
              aria-label="Message actions"
              sx={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                [isOwn ? "right" : "left"]: 0,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                px: 0.75,
                py: 0.625,
                bgcolor: colors.paper,
                border: `1px solid ${colors.toolbarBorder}`,
                borderRadius: `${radii.toolbar}px`,
                boxShadow: shadows.toolbar,
                opacity: 0,
                pointerEvents: "none",
                transform: "translateY(4px)",
                transition: "opacity .12s, transform .12s",
                whiteSpace: "nowrap",
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <ToolbarButton key={emoji} label={`React ${emoji}`} onClick={() => onReact(message.id, emoji)}>
                  {emoji}
                </ToolbarButton>
              ))}
              <ToolbarButton label="More reactions" tone="soft" onClick={setPickerAnchor}>
                <AddReactionOutlinedIcon />
              </ToolbarButton>
              {isOwn && (
                <>
                  <Box aria-hidden sx={{ width: "1px", height: 20, bgcolor: colors.border, mx: 0.5 }} />
                  <ToolbarButton label="Edit message" onClick={startEdit}>
                    <EditOutlinedIcon />
                  </ToolbarButton>
                  <ToolbarButton label="Delete message" tone="danger" onClick={() => setConfirmDelete(true)}>
                    <DeleteOutlinedIcon />
                  </ToolbarButton>
                </>
              )}
            </Box>
          )}
          {bubble}
        </Box>

        {reactionCounts.size > 0 && !message.deleted && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, px: 0.5, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
            {Array.from(reactionCounts.entries()).map(([emoji, { count, mine, names }]) => (
              <Tooltip key={emoji} title={names.join(", ")}>
                <ButtonBase
                  onClick={() => onReact(message.id, emoji)}
                  aria-pressed={mine}
                  aria-label={`${emoji} ${count}, ${mine ? "remove your reaction" : "react"}`}
                  sx={{
                    gap: 0.625,
                    px: 1.125,
                    height: 26,
                    borderRadius: `${radii.pill}px`,
                    border: `1px solid ${mine ? colors.softPrimaryBorder : colors.border}`,
                    bgcolor: mine ? colors.softPrimaryBg : colors.paper,
                    "&:hover": { borderColor: colors.softPrimaryBorder },
                  }}
                >
                  <Box component="span" sx={{ fontSize: 13 }}>
                    {emoji}
                  </Box>
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 600, color: mine ? colors.softPrimaryText : colors.slate600 }}>
                    {count}
                  </Box>
                </ButtonBase>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>

      <Popover
        open={!!pickerAnchor}
        anchorEl={pickerAnchor}
        onClose={() => setPickerAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ paper: { sx: { borderRadius: `${radii.card}px`, overflow: "hidden" } } }}
      >
        <EmojiPicker onEmojiClick={handleFullPickerPick} autoFocusSearch={false} lazyLoadEmojis />
      </Popover>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this message?"
        description="It will be replaced with “This message was deleted” for everyone. This can't be undone."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(message.id);
        }}
      />
    </Box>
  );
});
