"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";

/* eslint-disable react/prop-types */
export default function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
}
