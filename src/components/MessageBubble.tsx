import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import type { Message } from "../types";
import { formatTimestamp } from "../utils/thread";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  onReact: (emoji: string) => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  resolveUsername: (userId: string) => string;
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  resolveUsername,
}: MessageBubbleProps) {
  const [reactAnchorEl, setReactAnchorEl] = useState<HTMLElement | null>(null);
  const [fullPickerOpen, setFullPickerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const reactionCounts = new Map<string, { count: number; mine: boolean; names: string[] }>();
  for (const reaction of message.reactions ?? []) {
    const entry = reactionCounts.get(reaction.emoji) ?? { count: 0, mine: false, names: [] };
    entry.count += 1;
    if (reaction.userId === currentUserId) entry.mine = true;
    entry.names.push(reaction.userId === currentUserId ? "You" : resolveUsername(reaction.userId));
    reactionCounts.set(reaction.emoji, entry);
  }

  function closeReactPopover() {
    setReactAnchorEl(null);
    setFullPickerOpen(false);
  }

  function pick(emoji: string) {
    onReact(emoji);
    closeReactPopover();
  }

  function handleFullPickerPick(emojiData: EmojiClickData) {
    onReact(emojiData.emoji);
    closeReactPopover();
  }

  function startEdit() {
    setDraft(message.content);
    setEditing(true);
    setMenuAnchorEl(null);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(trimmed);
    }
    setEditing(false);
  }

  function handleDelete() {
    setMenuAnchorEl(null);
    if (window.confirm("Delete this message? This can't be undone.")) {
      onDelete();
    }
  }

  if (message.deleted) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          mb: 1,
        }}
      >
        <Paper
          sx={{ px: 1.5, py: 1, maxWidth: "70%", bgcolor: "grey.100", borderRadius: 2 }}
          elevation={0}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            This message was deleted
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        mb: 1,
      }}
    >
      {!isOwn && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {message.sender.username}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "center",
          gap: 0.5,
          "&:hover .bubble-actions": { opacity: 1 },
        }}
      >
        {editing ? (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", maxWidth: "70%" }}>
            <TextField
              size="small"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
            />
            <Button size="small" onClick={saveEdit} disabled={!draft.trim()}>
              Save
            </Button>
            <Button size="small" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </Box>
        ) : (
          <Paper
            sx={{
              px: 1.5,
              py: 1,
              maxWidth: "70%",
              bgcolor: isOwn ? "primary.main" : "grey.200",
              color: isOwn ? "primary.contrastText" : "text.primary",
              borderRadius: 2,
            }}
            elevation={0}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {message.content}
            </Typography>
          </Paper>
        )}
        {!editing && (
          <Box className="bubble-actions" sx={{ display: "flex", opacity: 0, transition: "opacity 0.15s" }}>
            <IconButton
              size="small"
              onClick={(e) => {
                setFullPickerOpen(false);
                setReactAnchorEl(e.currentTarget);
              }}
            >
              <AddReactionOutlinedIcon fontSize="small" />
            </IconButton>
            {isOwn && (
              <IconButton size="small" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {reactionCounts.size > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
          {Array.from(reactionCounts.entries()).map(([emoji, { count, mine, names }]) => (
            <Tooltip key={emoji} title={names.join(", ")} arrow>
              <Chip
                size="small"
                label={`${emoji} ${count}`}
                onClick={() => onReact(emoji)}
                color={mine ? "primary" : "default"}
                variant={mine ? "filled" : "outlined"}
                sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 12 } }}
              />
            </Tooltip>
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
        {formatTimestamp(message.createdAt)}
        {message.edited ? " · Edited" : ""}
      </Typography>

      <Popover
        open={!!reactAnchorEl}
        anchorEl={reactAnchorEl}
        onClose={closeReactPopover}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {fullPickerOpen ? (
          <EmojiPicker onEmojiClick={handleFullPickerPick} autoFocusSearch={false} />
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ p: 0.5 }}>
            {QUICK_REACTIONS.map((emoji) => (
              <IconButton key={emoji} size="small" onClick={() => pick(emoji)}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
              </IconButton>
            ))}
            <IconButton size="small" onClick={() => setFullPickerOpen(true)} title="More emoji">
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Popover>

      <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={() => setMenuAnchorEl(null)}>
        <MenuItem onClick={startEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
