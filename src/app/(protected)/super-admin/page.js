"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import StatusDialog from "@/components/StatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getBusinessesOverview, onboardBusinessWithUsers } from "@/services/userService";

export default function SuperAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, setSuperAdminBusiness } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessLocations: "",
    adminEmail: "",
    adminPassword: "",
    staffEntries: "",
  });

  const loadBusinesses = async () => {
    try {
      setError("");
      const data = await getBusinessesOverview();
      setRows(data);
    } catch (err) {
      setError(err.message || "Failed to load businesses.");
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const handleOnboard = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      if (!form.businessName || !form.adminEmail || !form.adminPassword) {
        throw new Error("Business name, admin email, and admin password are required.");
      }

      const staff = form.staffEntries
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [email, password] = line.split(":").map((part) => part?.trim() || "");
          return { email: String(email).toLowerCase(), password };
        });

      const businessLocations = form.businessLocations
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      await onboardBusinessWithUsers({
        businessName: form.businessName,
        businessLocations,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        staff,
      });

      setSuccess("Business onboarded successfully.");
      setForm({ businessName: "", businessLocations: "", adminEmail: "", adminPassword: "", staffEntries: "" });
      await loadBusinesses();
    } catch (err) {
      setError(err.message || "Failed to onboard business.");
    } finally {
      setSubmitting(false);
    }
  };

  const openBusiness = (businessId) => {
    setSuperAdminBusiness(businessId);
    router.push("/dashboard");
  };

  if (!isSuperAdmin) {
    return (
      <StatusDialog
        open
        severity="warning"
        title="Access Restricted"
        message="Only super admins can access this page."
        onClose={() => {}}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Super Admin Dashboard
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Onboard New Business</Typography>
          <StatusDialog open={Boolean(error)} severity="error" message={error} onClose={() => setError("")} />
          <StatusDialog open={Boolean(success)} severity="success" message={success} onClose={() => setSuccess("")} />
          <TextField
            label="Business Name"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Business Location(s)"
            value={form.businessLocations}
            onChange={(e) => setForm((prev) => ({ ...prev, businessLocations: e.target.value }))}
            placeholder={"One per line or comma-separated\nWestlands\nCBD"}
            helperText="Optional. Add one or multiple locations for this business."
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Admin Email"
            type="email"
            value={form.adminEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Admin Temporary Password"
            type="password"
            value={form.adminPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
            helperText="At least 8 characters"
            fullWidth
          />
          <TextField
            label="Staff Accounts (optional)"
            value={form.staffEntries}
            onChange={(e) => setForm((prev) => ({ ...prev, staffEntries: e.target.value }))}
            placeholder={"one per line: email:password\nexample@company.com:TempPass123"}
            multiline
            minRows={4}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleOnboard}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Onboarding..." : "Onboard Business"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Staff format: one user per line as <strong>email:password</strong>.
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Business</TableCell>
              <TableCell>Locations</TableCell>
              <TableCell>Admins</TableCell>
              <TableCell>Staff</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" align="center" py={2}>
                    No businesses found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.id}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{Array.isArray(item.locations) && item.locations.length ? item.locations.join(", ") : "-"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.admins} color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.staff} color="default" />
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => openBusiness(item.id)}>
                      Open Dashboard
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
