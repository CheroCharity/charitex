/* eslint-disable react/prop-types */
"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

export default function StatCard({ title, value, helper, icon }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack>
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
          </Stack>
          {icon}
        </Stack>
      </CardContent>
    </Card>
  );
}
