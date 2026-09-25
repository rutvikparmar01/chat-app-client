import axios from "axios";

/** Message + status from an axios error, falling back to `fallback` for non-HTTP failures. */
export function apiError(err: unknown, fallback: string): { message: string; status?: number } {
  if (axios.isAxiosError(err)) {
    if (!err.response) return { message: "Can't reach the server. Check your connection and try again." };
    const data = err.response.data as { message?: string } | undefined;
    return { message: data?.message ?? fallback, status: err.response.status };
  }
  return { message: fallback };
}
