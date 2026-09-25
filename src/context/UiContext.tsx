import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Box, Button, Snackbar, SnackbarContent } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { CreateGroupDialog } from "../components/CreateGroupDialog";
import { colors } from "../theme";
import type { User } from "../types";

interface ToastOptions {
  message: string;
  tone?: "success" | "error";
  action?: { label: string; onClick: () => void };
}

interface UiContextValue {
  toast: (options: ToastOptions) => void;
  openCreateGroup: (preselected?: User[]) => void;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<(ToastOptions & { key: number }) | null>(null);
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; preselected: User[] }>({ open: false, preselected: [] });

  const toast = useCallback((options: ToastOptions) => {
    setToastState({ ...options, key: Date.now() });
  }, []);

  const openCreateGroup = useCallback((preselected: User[] = []) => {
    setGroupDialog({ open: true, preselected });
  }, []);

  function closeToast(_?: unknown, reason?: string) {
    if (reason === "clickaway") return;
    setToastState(null);
  }

  const Icon = toastState?.tone === "error" ? ErrorOutlinedIcon : CheckCircleIcon;

  return (
    <UiContext.Provider value={{ toast, openCreateGroup }}>
      {children}
      <CreateGroupDialog
        open={groupDialog.open}
        preselected={groupDialog.preselected}
        onClose={() => setGroupDialog((prev) => ({ ...prev, open: false }))}
      />
      <Snackbar
        key={toastState?.key}
        open={!!toastState}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ bottom: { xs: 88, md: 24 } }}
      >
        <SnackbarContent
          role="status"
          message={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Icon sx={{ fontSize: 18, color: toastState?.tone === "error" ? colors.danger : colors.success }} />
              {toastState?.message}
            </Box>
          }
          action={
            toastState?.action ? (
              <Button
                size="small"
                onClick={() => {
                  toastState.action?.onClick();
                  setToastState(null);
                }}
                sx={{ color: colors.softPrimaryBorder, height: 30, "&:hover": { bgcolor: colors.whiteA08 } }}
              >
                {toastState.action.label}
              </Button>
            ) : undefined
          }
        />
      </Snackbar>
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
