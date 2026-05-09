/* eslint-disable react/prop-types */
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
