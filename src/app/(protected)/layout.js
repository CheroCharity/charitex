/* eslint-disable react/prop-types */
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import ClientOnly from "@/components/ClientOnly";

export default function ProtectedLayout({ children }) {
  return (
    <ClientOnly>
      <ProtectedRoute>
        <AppShell>{children}</AppShell>
      </ProtectedRoute>
    </ClientOnly>
  );
}
