import api, { unwrapObject } from "./axios";
import type { Message } from "../types";

export function editMessage(id: string, content: string) {
  return unwrapObject<Message>(api.patch(`/messages/${id}`, { content }), "message");
}

export function deleteMessage(id: string) {
  return api.delete<{ messageId: string }>(`/messages/${id}`);
}

export function reactToMessage(id: string, emoji: string) {
  return unwrapObject<Message>(api.post(`/messages/${id}/reactions`, { emoji }), "message");
}
