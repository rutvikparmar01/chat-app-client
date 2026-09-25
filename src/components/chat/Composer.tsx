import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Box, ButtonBase, InputBase, Popover, Tooltip, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { colors, gradients, radii, shadows } from "../../theme";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  mobile?: boolean;
}

function SendButton({ disabled, round }: { disabled: boolean; round?: boolean }) {
  return (
    <ButtonBase
      type="submit"
      disabled={disabled}
      aria-label="Send message"
      sx={{
        width: round ? 40 : 44,
        height: round ? 40 : 44,
        flexShrink: 0,
        borderRadius: round ? "50%" : `${radii.button}px`,
        background: gradients.primary,
        boxShadow: shadows.sendButton,
        color: colors.white,
        transition: "opacity .15s, filter .15s",
        "&:hover": { filter: "brightness(1.05)" },
        "&.Mui-disabled": { opacity: 0.45, boxShadow: "none" },
      }}
    >
      <SendIcon sx={{ fontSize: 19 }} />
    </ButtonBase>
  );
}

function PlainIcon({ label, onClick, disabled, children }: { label: string; onClick?: (el: HTMLElement) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip title={disabled ? `${label} — coming soon` : label}>
      <span style={{ display: "inline-flex" }}>
        <ButtonBase
          aria-label={label}
          disabled={disabled}
          onClick={(e) => onClick?.(e.currentTarget)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            color: colors.muted,
            "& svg": { fontSize: 20 },
            "&:hover": { color: colors.textSecondary, bgcolor: colors.subtle },
            "&.Mui-disabled": { opacity: 0.5 },
          }}
        >
          {children}
        </ButtonBase>
      </span>
    </Tooltip>
  );
}

export function Composer({ value, onChange, onSubmit, placeholder, inputRef, mobile }: ComposerProps) {
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const canSend = value.trim().length > 0;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function insertEmoji(data: EmojiClickData) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + data.emoji + value.slice(end);
    onChange(next);
    setEmojiAnchor(null);
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + data.emoji.length;
      el?.setSelectionRange(caret, caret);
    });
  }

  const input = (
    <InputBase
      inputRef={inputRef}
      multiline
      maxRows={5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      inputProps={{ "aria-label": placeholder }}
      sx={{ flex: 1, minWidth: 0, fontSize: 15, color: colors.ink, py: 0.75, "& textarea::placeholder": { color: colors.muted, opacity: 1 } }}
    />
  );

  const emojiPopover = (
    <Popover
      open={!!emojiAnchor}
      anchorEl={emojiAnchor}
      onClose={() => setEmojiAnchor(null)}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{ paper: { sx: { borderRadius: `${radii.card}px`, overflow: "hidden" } } }}
    >
      <EmojiPicker onEmojiClick={insertEmoji} lazyLoadEmojis />
    </Popover>
  );

  if (mobile) {
    return (
      <Box
        component="form"
        ref={formRef}
        onSubmit={onSubmit}
        sx={{ flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 1, px: 1.5, pt: 1, pb: "calc(10px + env(safe-area-inset-bottom))", bgcolor: colors.paper, borderTop: `1px solid ${colors.divider}` }}
      >
        <Tooltip title="Attachments — coming soon">
          <span style={{ display: "inline-flex" }}>
            <ButtonBase disabled aria-label="Add attachment" sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: colors.subtle, color: colors.muted, opacity: 0.7 }}>
              <AddIcon />
            </ButtonBase>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 0.5, minHeight: 40, pl: 2, pr: 0.5, borderRadius: `${radii.pill}px`, bgcolor: colors.subtle, "&:focus-within": { boxShadow: shadows.focusRing, bgcolor: colors.paper, outline: `1.5px solid ${colors.indigo}` } }}>
          {input}
          <PlainIcon label="Insert emoji" onClick={setEmojiAnchor}>
            <SentimentSatisfiedAltIcon />
          </PlainIcon>
        </Box>
        <SendButton disabled={!canSend} round />
        {emojiPopover}
      </Box>
    );
  }

  return (
    <Box sx={{ flexShrink: 0, px: 4, pt: 1, pb: 2.5, display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        component="form"
        ref={formRef}
        onSubmit={onSubmit}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1.25,
          minHeight: 60,
          pl: 1.5,
          pr: 1,
          py: 1,
          bgcolor: colors.paper,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.card}px`,
          boxShadow: shadows.composer,
          transition: "border-color .15s, box-shadow .15s",
          "&:focus-within": { borderColor: colors.indigo, boxShadow: shadows.focusRing },
        }}
      >
        <Box sx={{ display: "flex", gap: 0.5, alignSelf: "center" }}>
          <PlainIcon label="Attach file" disabled>
            <AttachFileIcon />
          </PlainIcon>
          <PlainIcon label="Insert emoji" onClick={setEmojiAnchor}>
            <SentimentSatisfiedAltIcon />
          </PlainIcon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center", display: "flex" }}>{input}</Box>
        <SendButton disabled={!canSend} />
        {emojiPopover}
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: colors.muted, whiteSpace: "pre" }}>
        {"Enter to send  ·  Shift + Enter for a new line"}
      </Typography>
    </Box>
  );
}
