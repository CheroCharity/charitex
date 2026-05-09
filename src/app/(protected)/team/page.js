"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
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
import {
  assignBusinessUserRole,
  getBusinessesOverview,
  getTeamUsers,
  onboardUserAccount,
  setBusinessFrozenStatus,
  setUserActiveStatus,
} from "@/services/userService";

export default function TeamPage() {
  const { businessId, user, isAdmin, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [pendingRole, setPendingRole] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [busyBusinessId, setBusyBusinessId] = useState("");
  const [onboarding, setOnboarding] = useState({
    email: "",
    password: "",
    role: "staff",
    businessId: "",
  });

  const canManageTeam = isAdmin || isSuperAdmin;

  const loadUsers = async () => {
    if (!businessId || !canManageTeam) return;
    try {
      const data = await getTeamUsers({ businessId, isSuperAdmin });
      setRows(data);
      setPendingRole(
        data.reduce((acc, item) => {
          acc[item.id] = item.role;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err.message || "Failed to load business users.");
    }
  };

  const loadBusinesses = async () => {
    if (!isSuperAdmin) return;
    try {
      const data = await getBusinessesOverview();
      setBusinesses(data);
      setOnboarding((prev) => ({
        ...prev,
        businessId: prev.businessId || data[0]?.id || "",
      }));
    } catch (err) {
      setError(err.message || "Failed to load businesses.");
    }
  };

  useEffect(() => {
    if (!canManageTeam) return;
    loadUsers();
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, isSuperAdmin, canManageTeam]);

  const updateRole = async (targetUserId) => {
    try {
      setError("");
      setSuccess("");
      setBusyUserId(targetUserId);
      await assignBusinessUserRole(targetUserId, pendingRole[targetUserId]);
      setSuccess("User role updated.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update role.");
    } finally {
      setBusyUserId("");
    }
  };

  const toggleUserStatus = async (targetUserId, nextStatus) => {
    try {
      setError("");
      setSuccess("");
      setBusyUserId(targetUserId);
      await setUserActiveStatus(targetUserId, nextStatus);
      setSuccess(`User ${nextStatus ? "activated" : "deactivated"}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update user status.");
    } finally {
      setBusyUserId("");
    }
  };

  const toggleBusinessFrozenStatus = async (targetBusinessId, nextFrozen) => {
    try {
      setError("");
      setSuccess("");
      setBusyBusinessId(targetBusinessId);
      await setBusinessFrozenStatus(targetBusinessId, nextFrozen);
      setSuccess(`Business ${nextFrozen ? "frozen" : "unfrozen"}.`);
      await Promise.all([loadBusinesses(), loadUsers()]);
    } catch (err) {
      setError(err.message || "Failed to update business status.");
    } finally {
      setBusyBusinessId("");
    }
  };

  const handleOnboardUser = async () => {
    try {
      setError("");
      setSuccess("");
      if (!onboarding.email || !onboarding.password) {
        throw new Error("Email and password are required.");
      }

      const targetBusinessId = isSuperAdmin ? onboarding.businessId : businessId;
      if (!targetBusinessId) {
        throw new Error("Target business is required.");
      }

      await onboardUserAccount({
        email: onboarding.email,
        password: onboarding.password,
        role: onboarding.role,
        businessId: targetBusinessId,
      });

      setSuccess("User onboarded successfully.");
      setOnboarding((prev) => ({
        ...prev,
        email: "",
        password: "",
      }));
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to onboard user.");
    }
  };

  if (!canManageTeam) {
    return <Alert severity="warning">Only business admins and super admins can access Team Management.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Team Management
      </Typography>

      <Alert severity="info">
        {isSuperAdmin
          ? "Super admin: you can view all users, activate/deactivate non-super-admin users, and freeze/unfreeze businesses."
          : "Business admin: you can view all users in your business, onboard new admins/staff, and activate/deactivate users in your business."}
      </Alert>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Onboard User</Typography>
          <TextField
            label="Email"
            type="email"
            value={onboarding.email}
            onChange={(e) => setOnboarding((prev) => ({ ...prev, email: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Temporary Password"
            type="password"
            value={onboarding.password}
            onChange={(e) => setOnboarding((prev) => ({ ...prev, password: e.target.value }))}
            helperText="Minimum 8 characters"
            fullWidth
          />
          <TextField
            select
            label="Role"
            value={onboarding.role}
            onChange={(e) => setOnboarding((prev) => ({ ...prev, role: e.target.value }))}
            fullWidth
          >
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="staff">staff</MenuItem>
          </TextField>
          {isSuperAdmin ? (
            <TextField
              select
              label="Business"
              value={onboarding.businessId}
              onChange={(e) => setOnboarding((prev) => ({ ...prev, businessId: e.target.value }))}
              fullWidth
            >
              {businesses.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <Button variant="contained" onClick={handleOnboardUser}>
            Create User
          </Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell>Assign Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" align="center" py={2}>
                    No users found for this business.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => {
                const isSelf = item.id === user?.id;
                const disableStatusAction = item.is_super_admin;
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.email}
                      {isSelf ? " (You)" : ""}
                    </TableCell>
                    <TableCell>{item.businesses?.name || "-"}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell sx={{ width: 220 }}>
                      <TextField
                        select
                        size="small"
                        value={pendingRole[item.id] || item.role}
                        onChange={(e) =>
                          setPendingRole((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="admin">admin</MenuItem>
                        <MenuItem value="staff">staff</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.is_active ? "success" : "default"}
                        label={item.is_active ? "active" : "deactivated"}
                      />
                      {item.is_super_admin ? (
                        <Chip size="small" sx={{ ml: 1 }} color="warning" label="super admin" />
                      ) : null}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={busyUserId === item.id}
                        onClick={() => updateRole(item.id)}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="contained"
                        color={item.is_active ? "warning" : "success"}
                        size="small"
                        disabled={busyUserId === item.id || disableStatusAction}
                        onClick={() => toggleUserStatus(item.id, !item.is_active)}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {isSuperAdmin ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Business</TableCell>
                <TableCell>Admins</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" align="center" py={2}>
                      No businesses found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.admins}</TableCell>
                    <TableCell>{item.staff}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.is_frozen ? "warning" : "success"}
                        label={item.is_frozen ? "frozen" : "active"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color={item.is_frozen ? "success" : "warning"}
                        disabled={busyBusinessId === item.id}
                        onClick={() => toggleBusinessFrozenStatus(item.id, !item.is_frozen)}
                      >
                        {item.is_frozen ? "Unfreeze" : "Freeze"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  );
}
