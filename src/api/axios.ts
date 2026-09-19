import axios, { type AxiosResponse } from "axios";
import { normalizeIds } from "../utils/normalize";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Populated sub-documents (participants/members/sender) come back with raw
// Mongoose `_id`s — normalize every response so the app can rely on `.id`.
api.interceptors.response.use((response) => {
  response.data = normalizeIds(response.data);
  return response;
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/**
 * List endpoints wrap the array in a key named after the resource
 * (e.g. `{ conversations: [...] }`) instead of returning it raw.
 */
export async function unwrapList<T>(
  request: Promise<AxiosResponse<Record<string, T[]>>>,
  key: string
): Promise<AxiosResponse<T[]>> {
  const response = await request;
  const body = response.data;
  const list = Array.isArray(body) ? body : body?.[key];
  return { ...response, data: Array.isArray(list) ? list : [] };
}

/**
 * Single-resource endpoints wrap the object in a key named after the
 * resource (e.g. `{ conversation: {...} }`, `{ group: {...} }`).
 */
export async function unwrapObject<T>(
  request: Promise<AxiosResponse<Record<string, T>>>,
  key: string
): Promise<AxiosResponse<T>> {
  const response = await request;
  const body = response.data as Record<string, unknown>;
  const value = body && typeof body === "object" && key in body ? body[key] : body;
  return { ...response, data: value as T };
}

export default api;
