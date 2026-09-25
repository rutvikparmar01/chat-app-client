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

/** Resolve a sender that may arrive populated (`{id, username}`) or as a bare id. */
function senderIdOf(sender: unknown): string | undefined {
  if (typeof sender === "string") return sender;
  if (sender && typeof sender === "object" && "id" in sender) return String((sender as { id: unknown }).id);
  return undefined;
}

/**
 * Sidebar preview line: "You: …" for your own messages, "Sender: …" in groups,
 * plain text in direct chats.
 */
export function threadPreview(thread: ChatThread, currentUserId?: string): string {
  const message = thread.lastMessage;
  if (!message) return "No messages yet";
  const body = message.deleted ? "Message deleted" : message.content;
  const senderId = senderIdOf(message.sender);
  if (senderId && senderId === currentUserId) return `You: ${body}`;
  if (thread.isGroup) {
    const populated = typeof message.sender === "object" ? message.sender?.username : undefined;
    const name = populated ?? thread.members.find((m) => m.id === senderId)?.username;
    return name ? `${name}: ${body}` : body;
  }
  return body;
}

export function threadMembers(thread: ChatThread): User[] {
  return thread.isGroup ? thread.members : thread.participants;
}
