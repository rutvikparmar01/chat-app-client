import api, { unwrapList, unwrapObject } from "./axios";
import type { User } from "../types";

export function getUsers(search?: string) {
  return unwrapList<User>(
    api.get("/users", { params: search ? { search } : undefined }),
    "users"
  );
}

export function getUser(id: string) {
  return unwrapObject<User>(api.get(`/users/${id}`), "user");
}
