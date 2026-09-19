import api, { unwrapList, unwrapObject } from "./axios";
import type { ChatThread, Conversation, Message } from "../types";

interface RawThread {
  type: "conversation" | "group";
  [key: string]: unknown;
}

// Backend list items use a `type: "conversation" | "group"` discriminant
// instead of the `isGroup` boolean the rest of the app relies on.
function toChatThread(item: RawThread): ChatThread {
  const { type, ...rest } = item;
  return { ...rest, isGroup: type === "group" } as ChatThread;
}

export async function getConversations() {
  const response = await unwrapList<RawThread>(api.get("/conversations"), "conversations");
  return { ...response, data: response.data.map(toChatThread) };
}

export async function createConversation(userId: string) {
  const response = await unwrapObject<Conversation>(
    api.post("/conversations", { userId }),
    "conversation"
  );
  return { ...response, data: { ...response.data, isGroup: false as const } };
}

export function getConversationMessages(conversationId: string, page = 1, limit = 30) {
  return unwrapList<Message>(
    api.get(`/conversations/${conversationId}/messages`, { params: { page, limit } }),
    "messages"
  );
}
