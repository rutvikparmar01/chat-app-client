import type { ChatThread, User } from "../types";

export function threadLabel(thread: ChatThread, currentUserId?: string): string {
  if (thread.isGroup) return thread.name;
  const other = thread.participants.find((p) => p.id !== currentUserId);
  return other?.username ?? "Unknown";
}

export function threadOtherUser(thread: ChatThread, currentUserId?: string): User | undefined {
  if (thread.isGroup) return undefined;
  return thread.participants.find((p) => p.id !== currentUserId);
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
