import api, { unwrapList, unwrapObject } from "./axios";
import type { AxiosResponse } from "axios";
import type { Group, Message } from "../types";

async function withGroupFlag(request: Promise<AxiosResponse<Omit<Group, "isGroup">>>) {
  const response = await request;
  return { ...response, data: { ...response.data, isGroup: true as const } };
}

export function createGroup(name: string, memberIds: string[]) {
  return withGroupFlag(unwrapObject<Omit<Group, "isGroup">>(api.post("/groups", { name, memberIds }), "group"));
}

export function getGroup(id: string) {
  return withGroupFlag(unwrapObject<Omit<Group, "isGroup">>(api.get(`/groups/${id}`), "group"));
}

export function addGroupMembers(groupId: string, memberIds: string[]) {
  return withGroupFlag(
    unwrapObject<Omit<Group, "isGroup">>(api.post(`/groups/${groupId}/members`, { memberIds }), "group")
  );
}

export function removeGroupMember(groupId: string, userId: string) {
  return withGroupFlag(
    unwrapObject<Omit<Group, "isGroup">>(api.delete(`/groups/${groupId}/members/${userId}`), "group")
  );
}

export function getGroupMessages(groupId: string, page = 1, limit = 30) {
  return unwrapList<Message>(
    api.get(`/groups/${groupId}/messages`, { params: { page, limit } }),
    "messages"
  );
}
