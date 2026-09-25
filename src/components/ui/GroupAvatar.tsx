import { Box } from "@mui/material";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import { avatarGradient, colors } from "../../theme";

export function GroupAvatar({ groupId, size = 40 }: { groupId: string; size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.32)}px`,
        background: avatarGradient(groupId),
        color: colors.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PeopleOutlineIcon sx={{ fontSize: Math.round(size * 0.5) }} />
    </Box>
  );
}
