"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import StatusDialog from "@/components/StatusDialog";

export default function LoginClient() {
  const isMountedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);
  const { signIn, isAuthenticated, loading: authLoading, accessBlockedReason } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const getSubmitLabel = () => {
    if (loading) return "Please wait...";
    return "Sign In";
  };

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [mounted, authLoading, isAuthenticated, router, nextUrl]);

  if (!mounted || authLoading || isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(form.email, form.password);
      router.replace(nextUrl);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || "Authentication failed");
    } finally {
      if (!isMountedRef.current) return;
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

            <StatusDialog
              open={Boolean(accessBlockedReason)}
              severity="warning"
              title="Access Restricted"
              message={accessBlockedReason || ""}
              onClose={() => {}}
            />
            <StatusDialog open={Boolean(error)} severity="error" message={error} onClose={() => setError("")} />

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
                <Typography variant="caption" color="text.secondary">
                  Accounts are created by a business admin or super admin.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
