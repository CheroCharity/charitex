/* eslint-disable react/prop-types */
"use client";

import { cloneElement, isValidElement } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

export default function StatCard({ title, value, helper, icon, iconColor = "primary.main", iconBg = "rgba(63, 42, 74, 0.08)" }) {
  const styledIcon = isValidElement(icon)
    ? cloneElement(icon, {
        sx: [{ color: iconColor, fontSize: 24 }, icon.props?.sx],
      })
    : icon;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            {helper ? (
              <Typography variant="caption" color="text.secondary">
                {helper}
              </Typography>
            ) : null}
          </Box>
          {styledIcon ? (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: iconBg,
              }}
            >
              {styledIcon}
            </Box>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
