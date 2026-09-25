import { Box, Skeleton } from "@mui/material";
import { radii } from "../../theme";

export function ConversationRowSkeleton() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rounded" width="55%" height={12} sx={{ mb: 1, borderRadius: `${radii.pill}px` }} />
        <Skeleton variant="rounded" width="85%" height={10} sx={{ borderRadius: `${radii.pill}px` }} />
      </Box>
    </Box>
  );
}

export function BubbleSkeleton({ own, width }: { own?: boolean; width: number }) {
  return (
    <Box sx={{ display: "flex", justifyContent: own ? "flex-end" : "flex-start" }}>
      <Skeleton
        variant="rounded"
        width={width}
        height={44}
        sx={{
          maxWidth: "80%",
          borderRadius: `${radii.bubble}px`,
          [own ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: `${radii.bubbleTail}px`,
        }}
      />
    </Box>
  );
}

export function CardSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25, p: 3 }}>
      <Skeleton variant="circular" width={72} height={72} />
      <Skeleton variant="rounded" width="60%" height={14} sx={{ borderRadius: `${radii.pill}px` }} />
      <Skeleton variant="rounded" width="40%" height={10} sx={{ borderRadius: `${radii.pill}px` }} />
      <Skeleton variant="rounded" width="100%" height={36} sx={{ mt: 1 }} />
    </Box>
  );
}
