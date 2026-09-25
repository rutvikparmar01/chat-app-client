import { useMemo, useRef, useState, type ReactNode } from "react";
import { Box, ButtonBase, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { removeGroupMember } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { useOpenDirectChat } from "../hooks/useOpenDirectChat";
import { colors, radii } from "../theme";
import { presenceLabel } from "../utils/time";
import { AddMembersDialog } from "./AddMembersDialog";
import { ConfirmDialog, DangerButton, GroupAvatar, IconBtn, PrimaryButton, SearchInput, SoftButton, UserAvatar } from "./ui";
import type { Group, User } from "../types";

type Variant = "panel" | "drawer" | "page";

function Tag({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ px: 0.75, py: 0.125, borderRadius: "6px", bgcolor: colors.softPrimaryBg, color: colors.softPrimaryText, fontSize: 10, fontWeight: 700, lineHeight: "16px", flexShrink: 0 }}>
      {children}
    </Box>
  );
}

function ActionTile({ label, icon, onClick, disabled, danger }: { label: string; icon: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean }) {
  const tile = (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? `${label} (coming soon)` : label}
      sx={{
        flex: 1,
        flexDirection: "column",
        gap: 0.75,
        py: 1.25,
        borderRadius: `${radii.listItem}px`,
        bgcolor: danger ? colors.dangerBg : colors.softPrimaryBg,
        color: danger ? colors.dangerText : colors.softPrimaryText,
        fontSize: 12,
        fontWeight: 600,
        "& svg": { fontSize: 20 },
        "&.Mui-disabled": { opacity: 0.5 },
      }}
    >
      {icon}
      {label}
    </ButtonBase>
  );
  return disabled ? (
    <Tooltip title={`${label} — coming soon`}>
      <Box sx={{ flex: 1, display: "flex" }}>{tile}</Box>
    </Tooltip>
  ) : (
    tile
  );
}

export function GroupInfoPanel({ group, onClose, variant = "panel" }: { group: Group; onClose: () => void; variant?: Variant }) {
  const { user } = useAuth();
  const { onlineUserIds, refresh, setActiveThread, lastSeenById, typingByThread } = useChat();
  const { toast } = useUi();
  const { openDirectChat } = useOpenDirectChat();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; member: User } | null>(null);
  const [confirm, setConfirm] = useState<{ member: User; isSelf: boolean } | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const page = variant === "page";

  const isCreator = group.createdBy === user?.id;
  const typingIds = typingByThread[group.id] ?? [];
  const onlineCount = group.members.filter((m) => m.id === user?.id || onlineUserIds.has(m.id)).length;
  const creatorName = group.createdBy === user?.id ? "you" : group.members.find((m) => m.id === group.createdBy)?.username ?? "someone";
  const createdOn = group.createdAt ? new Date(group.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : null;

  const members = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    const list = q ? group.members.filter((m) => m.username.toLowerCase().includes(q)) : group.members;
    // You first, then admin, then online, then alphabetical.
    return [...list].sort((a, b) => {
      const rank = (m: User) => (m.id === user?.id ? 0 : m.id === group.createdBy ? 1 : onlineUserIds.has(m.id) ? 2 : 3);
      return rank(a) - rank(b) || a.username.localeCompare(b.username);
    });
  }, [group.members, group.createdBy, memberQuery, onlineUserIds, user?.id]);

  async function removeMember(memberId: string, isSelf: boolean) {
    setError(null);
    setPendingId(memberId);
    try {
      await removeGroupMember(group.id, memberId);
      if (isSelf) {
        setActiveThread(null);
        onClose();
        toast({ message: `You left “${group.name}”` });
      }
      await refresh();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? "Only the group creator can remove other members."
          : "Failed to remove member. Try again."
      );
    } finally {
      setPendingId(null);
    }
  }

  function focusMemberSearch() {
    searchWrapRef.current?.querySelector("input")?.focus();
  }

  return (
    <Box
      component="aside"
      aria-label="Group info"
      sx={{
        width: variant === "panel" ? 320 : "100%",
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.paper,
        borderLeft: variant === "panel" ? `1px solid ${colors.divider}` : "none",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: page ? 1.5 : 2.5, height: page ? 64 : 76, flexShrink: 0 }}>
        {page && <IconBtn label="Back to chat" icon={<ChevronLeftIcon />} onClick={onClose} sx={{ bgcolor: "transparent" }} />}
        <Typography component="h2" sx={{ flex: 1, fontSize: 17, fontWeight: 600, textAlign: page ? "center" : "left" }}>
          Group info
        </Typography>
        {page ? (
          <IconBtn label="Rename group" tooltip="Rename — coming soon" icon={<EditOutlinedIcon />} disabled sx={{ bgcolor: "transparent" }} />
        ) : (
          <IconBtn label="Close group info" icon={<CloseIcon />} onClick={onClose} size="small" />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2.5, pb: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", pt: 1, pb: 2.5 }}>
          <GroupAvatar groupId={group.id} size={76} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.75, maxWidth: "100%" }}>
            <Typography noWrap sx={{ fontSize: 18, fontWeight: 700 }}>
              {group.name}
            </Typography>
            {!page && (
              <Tooltip title="Rename — coming soon">
                <EditOutlinedIcon aria-hidden sx={{ fontSize: 16, color: colors.muted }} />
              </Tooltip>
            )}
          </Box>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5 }}>
            {page ? `${group.members.length} members · ${onlineCount} online` : `Created by ${creatorName}${createdOn ? ` · ${createdOn}` : ""}`}
          </Typography>

          {page ? (
            <Box sx={{ display: "flex", gap: 1, width: "100%", mt: 2.5 }}>
              <ActionTile label="Add" icon={<PersonAddAltIcon />} onClick={() => setAddOpen(true)} />
              <ActionTile label="Search" icon={<SearchIcon />} onClick={focusMemberSearch} />
              <ActionTile label="Mute" icon={<NotificationsOffOutlinedIcon />} disabled />
              <ActionTile label="Leave" icon={<LogoutIcon />} danger onClick={() => user && setConfirm({ member: user, isSelf: true })} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, mt: 2.25 }}>
              <PrimaryButton size="small" startIcon={<PersonAddAltIcon />} onClick={() => setAddOpen(true)}>
                Add members
              </PrimaryButton>
              <Tooltip title="Renaming groups isn't supported yet">
                <span>
                  <SoftButton size="small" startIcon={<EditOutlinedIcon />} disabled>
                    Rename
                  </SoftButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Box sx={{ height: "1px", bgcolor: colors.divider, mb: 2 }} />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="overline" component="h3" sx={{ color: colors.muted }}>
            MEMBERS · {group.members.length}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.625, fontSize: 12, fontWeight: 600, color: colors.successText }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: colors.success }} />
            {onlineCount} online
          </Box>
        </Box>

        <Box ref={searchWrapRef}>
          <SearchInput value={memberQuery} onChange={setMemberQuery} placeholder="Search members" height={40} />
        </Box>

        {error && (
          <Typography role="alert" sx={{ mt: 1.5, fontSize: 12, fontWeight: 500, color: colors.dangerText, bgcolor: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, borderRadius: "10px", px: 1.5, py: 1 }}>
            {error}
          </Typography>
        )}

        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
          {members.map((member) => {
            const online = member.id === user?.id || onlineUserIds.has(member.id);
            const isSelf = member.id === user?.id;
            const typing = typingIds.includes(member.id);
            const status = typing
              ? { text: "typing…", color: colors.primary }
              : online
                ? { text: isSelf ? "Online · You" : "Online", color: colors.successText }
                : { text: presenceLabel(false, lastSeenById[member.id] ?? member.lastSeen), color: colors.muted };
            const hasMenu = !isSelf || isCreator;
            return (
              <Box component="li" key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, opacity: pendingId === member.id ? 0.5 : 1 }}>
                <UserAvatar name={member.username} userId={member.id} size={40} status={online ? "online" : "offline"} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                      {member.username}
                    </Typography>
                    {member.id === group.createdBy && <Tag>Admin</Tag>}
                  </Box>
                  <Typography noWrap sx={{ fontSize: 12, fontWeight: 500, color: status.color }}>
                    {status.text}
                  </Typography>
                </Box>
                {hasMenu && !isSelf && (
                  <IconBtn
                    label={`More options for ${member.username}`}
                    icon={<MoreVertIcon />}
                    size="small"
                    sx={{ bgcolor: "transparent" }}
                    onClick={(e) => setMenu({ anchor: e.currentTarget, member })}
                  />
                )}
              </Box>
            );
          })}
          {members.length === 0 && (
            <Typography sx={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", py: 2 }}>No members match “{memberQuery}”.</Typography>
          )}
        </Box>
      </Box>

      {!page && (
        <Box sx={{ p: 2.5, pt: 1.5, flexShrink: 0 }}>
          <DangerButton fullWidth startIcon={<LogoutIcon />} disabled={pendingId === user?.id} onClick={() => user && setConfirm({ member: user, isSelf: true })} sx={{ height: 46 }}>
            Leave group
          </DangerButton>
        </Box>
      )}

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem
          onClick={() => {
            const target = menu?.member;
            setMenu(null);
            if (target) openDirectChat(target.id);
          }}
        >
          Message
        </MenuItem>
        {isCreator && (
          <MenuItem
            sx={{ color: colors.dangerText }}
            onClick={() => {
              const target = menu?.member;
              setMenu(null);
              if (target) setConfirm({ member: target, isSelf: false });
            }}
          >
            Remove from group
          </MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.isSelf ? `Leave “${group.name}”?` : `Remove ${confirm?.member.username}?`}
        description={confirm?.isSelf ? "You'll stop receiving messages from this group." : `${confirm?.member.username} will no longer see or send messages in this group.`}
        confirmLabel={confirm?.isSelf ? "Leave group" : "Remove"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) removeMember(confirm.member.id, confirm.isSelf);
          setConfirm(null);
        }}
      />

      <AddMembersDialog open={addOpen} onClose={() => setAddOpen(false)} group={group} />
    </Box>
  );
}
