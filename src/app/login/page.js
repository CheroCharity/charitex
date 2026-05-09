"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);
  const { signIn, signUp, isAuthenticated } = useAuth();

  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const getSubmitLabel = () => {
    if (loading) return "Please wait...";
    if (mode === "signin") return "Sign In";
    return "Create Account";
  };

  if (isAuthenticated) {
    router.replace("/dashboard");
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signin") {
        await signIn(form.email, form.password);
        router.replace(nextUrl);
      } else {
        await signUp(form.email, form.password);
        setSuccess("Account created. You can now sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card sx={{ width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Charitex
              </Typography>
              <Typography color="text.secondary">Inventory tracking for your business</Typography>
            </Box>

            <Tabs value={mode} onChange={(_e, value) => setMode(value)}>
              <Tab label="Sign In" value="signin" />
              <Tab label="Sign Up" value="signup" />
            </Tabs>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange("email")}
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange("password")}
                  fullWidth
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {getSubmitLabel()}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
