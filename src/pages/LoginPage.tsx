import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Tooltip, Typography } from "@mui/material";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthField } from "../components/auth/AuthField";
import { AuthHeading, AuthSubmit, DesignCheckbox, OrDivider, SwitchLink } from "../components/auth/AuthParts";
import { Logo } from "../components/ui";
import { colors } from "../theme";
import { apiError } from "../utils/apiError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!password) next.password = "Enter your password.";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      // The backend deliberately doesn't say which of the two was wrong.
      setErrors({ password: apiError(err, "Login failed").message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      headline="Conversations that feel instant."
      subtitle="Chat one-to-one or with your whole team. See who is online, who is typing, and never lose track of unread messages."
      maxWidth={420}
    >
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.75 }}>
        <Logo />
        <AuthHeading title="Welcome back 👋" subtitle="Sign in to pick up your conversations where you left off." />
        <AuthField
          label="Email address"
          icon={<MailOutlinedIcon />}
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          error={errors.email}
        />
        <AuthField
          label="Password"
          icon={<LockOutlinedIcon />}
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password}
        />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Tooltip title="Sessions are always remembered on this device">
            <span>
              <DesignCheckbox checked disabled label="Remember me" />
            </span>
          </Tooltip>
          <Tooltip title="Password reset isn't available yet">
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: colors.primary, opacity: 0.55, cursor: "not-allowed" }} aria-disabled>
              Forgot password?
            </Typography>
          </Tooltip>
        </Box>
        <AuthSubmit loading={loading}>Sign in</AuthSubmit>
        <OrDivider />
        <SwitchLink prompt="Don't have an account?" to="/register" label="Create one" />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 1.75,
            py: 1.25,
            borderRadius: "10px",
            bgcolor: colors.subtle,
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 15, color: colors.successText }} />
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.slate600 }}>
            Protected with JWT · bcrypt-hashed passwords
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
