"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Chip,
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
import { useAuth } from "@/contexts/AuthContext";
import { getBusinessesOverview, onboardBusiness } from "@/services/userService";

export default function SuperAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, setSuperAdminBusiness } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ businessName: "", adminEmail: "", staffEmails: "" });

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
      setError("");
      setSuccess("");
      if (!form.businessName || !form.adminEmail) {
        throw new Error("Business name and admin email are required.");
      }

      const staffEmails = form.staffEmails
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await onboardBusiness({
        businessName: form.businessName,
        adminEmail: form.adminEmail,
        staffEmails,
      });

      setSuccess("Business onboarded successfully with admin/staff assignments.");
      setForm({ businessName: "", adminEmail: "", staffEmails: "" });
      await loadBusinesses();
    } catch (err) {
      setError(err.message || "Failed to onboard business.");
    }
  };

  const openBusiness = (businessId) => {
    setSuperAdminBusiness(businessId);
    router.push("/dashboard");
  };

  if (!isSuperAdmin) {
    return <Alert severity="warning">Only super admins can access this page.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Super Admin Dashboard
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Onboard New Business</Typography>
          <TextField
            label="Business Name"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
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
            label="Staff Emails (comma-separated)"
            value={form.staffEmails}
            onChange={(e) => setForm((prev) => ({ ...prev, staffEmails: e.target.value }))}
            placeholder="staff1@company.com, staff2@company.com"
            fullWidth
          />
          <Button variant="contained" onClick={handleOnboard}>
            Onboard Business
          </Button>
          <Typography variant="body2" color="text.secondary">
            Note: Admin and staff users must already have accounts (signed up).
          </Typography>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business</TableCell>
              <TableCell>Admins</TableCell>
              <TableCell>Staff</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
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
