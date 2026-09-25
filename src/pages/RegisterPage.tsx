import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthField } from "../components/auth/AuthField";
import { AuthHeading, AuthSubmit, SwitchLink } from "../components/auth/AuthParts";
import { Logo } from "../components/ui";
import { colors } from "../theme";
import { apiError } from "../utils/apiError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

/** 0–4, one point each for: 8+ chars, 12+ chars, a number, a symbol or mixed case. */
function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  return Math.max(score, 1);
}

const STRENGTH = [
  null,
  { label: "Weak password — try 8+ characters", color: colors.danger, text: colors.dangerText },
  { label: "Fair password — add a number or symbol", color: colors.warning, text: colors.warning },
  { label: "Good password — 12+ chars makes it stronger", color: colors.success, text: colors.successText },
  { label: "Strong password — 12+ chars, number & symbol", color: colors.success, text: colors.successText },
];

function StrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password);
  const meta = STRENGTH[score];
  if (!meta) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} aria-live="polite">
      <Box sx={{ display: "flex", gap: 0.75 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ flex: 1, height: 5, borderRadius: "3px", bgcolor: i <= score ? meta.color : colors.border }} />
        ))}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: meta.text }}>{meta.label}</Typography>
    </Box>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!username.trim()) next.username = "Pick a username.";
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!password) next.password = "Choose a password.";
    return next;
  }

  function clear(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/chat");
    } catch (err) {
      const { message, status } = apiError(err, "Registration failed");
      // 409 = username or email taken; everything else is shown under the last field.
      setErrors(status === 409 ? { email: `${message}. Try signing in.` } : { password: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      headline="Your team, one tap away."
      subtitle="Create groups, react to messages, edit what you said, and keep every conversation in sync across devices."
      maxWidth={440}
    >
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Logo />
        <AuthHeading title="Create your account" subtitle="Join ChatSphere and start chatting in seconds." />
        <AuthField
          label="Username"
          icon={<AlternateEmailIcon />}
          value={username}
          onChange={(v) => {
            setUsername(v);
            clear("username");
          }}
          placeholder="rutvik.dev"
          autoComplete="username"
          autoFocus
          error={errors.username}
        />
        <AuthField
          label="Email address"
          icon={<MailOutlinedIcon />}
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clear("email");
          }}
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email}
        />
        <AuthField
          label="Password"
          icon={<LockOutlinedIcon />}
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            clear("password");
          }}
          placeholder="Create a password"
          autoComplete="new-password"
          error={errors.password}
        >
          <StrengthMeter password={password} />
        </AuthField>
        <AuthSubmit loading={loading}>Create account</AuthSubmit>
        <SwitchLink prompt="Already have an account?" to="/login" label="Sign in" />
      </Box>
    </AuthLayout>
  );
}
