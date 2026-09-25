import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createConversation } from "../api/conversations";
import { useChat } from "../context/ChatContext";
import { useUi } from "../context/UiContext";
import { apiError } from "../utils/apiError";

/**
 * Open (or create) the 1:1 conversation with a user and jump to /chat.
 * Same calls the old sidebar "Users" tab made: POST /conversations → refresh → select.
 */
export function useOpenDirectChat() {
  const { refresh, setActiveThread } = useChat();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const openDirectChat = useCallback(
    async (userId: string) => {
      setOpeningId(userId);
      try {
        const { data } = await createConversation(userId);
        await refresh();
        setActiveThread(data);
        navigate("/chat");
      } catch (err) {
        toast({ message: apiError(err, "Couldn't open that conversation").message, tone: "error" });
      } finally {
        setOpeningId(null);
      }
    },
    [refresh, setActiveThread, navigate, toast]
  );

  return { openDirectChat, openingId };
}
