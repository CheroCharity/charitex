/* eslint-disable react/prop-types */
"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";

export default function StatCard({ title, value, helper, icon }) {
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
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}
