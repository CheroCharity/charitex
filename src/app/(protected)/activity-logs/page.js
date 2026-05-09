"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getActivityLogs, getActivityLogsForExport } from "@/services/activityLogService";

function getCompactChangeText(row) {
  const payload = row.payload || {};

  if (payload.changed_fields && typeof payload.changed_fields === "object") {
    const entries = Object.entries(payload.changed_fields);
    if (entries.length === 0) return "-";
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join("\n");
  }

  if (row.action === "UPDATE" && payload.before && payload.after) {
    const keys = Object.keys(payload.after);
    const changes = keys
      .filter((key) => JSON.stringify(payload.before[key]) !== JSON.stringify(payload.after[key]))
      .map((key) => `${key}: ${String(payload.after[key])}`);
    return changes.length ? changes.join("\n") : "-";
  }

  if (row.action === "INSERT" && payload.after) {
    return Object.entries(payload.after)
      .slice(0, 5)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  }

  if (row.action === "DELETE" && payload.before) {
    return Object.entries(payload.before)
      .slice(0, 5)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  }

  return "-";
}

function toCsv(rows) {
  const headers = ["created_at", "actor", "entity_table", "action", "entity_id", "changed_fields"];
  const lines = rows.map((row) => {
    const changed = getCompactChangeText(row).replaceAll("\n", " | ").replaceAll(",", " ");
    return [
      row.created_at,
      row.actor_email || row.user_id || "system",
      row.entity_table,
      row.action,
      row.entity_id || "",
      changed,
    ].join(",");
  });
  return [headers.join(","), ...lines].join("\n");
}

export default function ActivityLogsPage() {
  const { businessId } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ from: "", to: "", action: "" });

  const loadData = async () => {
    if (!businessId) return;
    try {
      setError("");
      const data = await getActivityLogs(businessId, {
        ...filters,
        page: page + 1,
        pageSize,
      });
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || "Failed to load activity logs.");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, page, pageSize]);

  const handleChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadData();
  };

  const handleExport = async () => {
    try {
      setError("");
      const exportRows = await getActivityLogsForExport(businessId, filters);
      const csv = toCsv(exportRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `charitex-activity-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export logs.");
    }
  };

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [rows]
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Activity Logs
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" },
            alignItems: "center",
          }}
        >
          <Box>
            <TextField
              label="From"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.from}
              onChange={handleChange("from")}
              fullWidth
            />
          </Box>
          <Box>
            <TextField
              label="To"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.to}
              onChange={handleChange("to")}
              fullWidth
            />
          </Box>
          <Box>
            <TextField
              select
              label="Action"
              value={filters.action}
              onChange={handleChange("action")}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="INSERT">INSERT</MenuItem>
              <MenuItem value="UPDATE">UPDATE</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Button variant="outlined" onClick={handleApplyFilters} fullWidth>
              Apply Filters
            </Button>
          </Box>
          <Box sx={{ gridColumn: { xs: "1", sm: "1 / span 4" } }}>
            <Button variant="contained" onClick={handleExport} fullWidth>
              Export CSV
            </Button>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>Changed Fields</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" align="center" py={2}>
                    No activity logs found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                  <TableCell>{row.actor_email || row.user_id || "system"}</TableCell>
                  <TableCell>{row.entity_table}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.entity_id || "-"}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ m: 0, whiteSpace: "pre-wrap", maxWidth: 420 }}
                    >
                      {getCompactChangeText(row)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>
    </Stack>
  );
}
