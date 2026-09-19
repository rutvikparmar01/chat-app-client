/**
 * The backend's populated sub-documents (conversation.participants, group.members,
 * message.sender) come back as raw Mongoose `_id`, while top-level list items use
 * `id`. This recursively normalizes every `_id` to `id` so the rest of the app can
 * rely on `.id` everywhere, regardless of which endpoint the data came from.
 */
export function normalizeIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeIds(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      if (key === "_id") continue;
      result[key] = normalizeIds(source[key]);
    }
    if ("_id" in source && source._id != null) {
      result.id = String(source._id);
    }
    return result as T;
  }
  return value;
}
