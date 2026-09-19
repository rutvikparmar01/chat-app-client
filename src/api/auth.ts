import api, { unwrapObject } from "./axios";
import type { AuthResponse, User } from "../types";

export function register(username: string, email: string, password: string) {
  return api.post<AuthResponse>("/auth/register", { username, email, password });
}

export function login(email: string, password: string) {
  return api.post<AuthResponse>("/auth/login", { email, password });
}

export function getMe() {
  return unwrapObject<User>(api.get("/auth/me"), "user");
}
