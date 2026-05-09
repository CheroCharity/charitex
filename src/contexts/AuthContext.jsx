/* eslint-disable react/prop-types */
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { getSession, signInWithEmail, signOutUser } from "@/services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [accessBlockedReason, setAccessBlockedReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId) {
      if (!mounted) return;
      if (!userId) {
        setProfile(null);
        setAccessBlockedReason("");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("users_profile")
        .select("id, email, business_id, role, is_super_admin, is_active")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      let business = null;
      if (profileData?.business_id) {
        const { data: businessData } = await supabase
          .from("businesses")
          .select("id, name, is_frozen")
          .eq("id", profileData.business_id)
          .maybeSingle();
        business = businessData || null;
      }

      if (profileData && !profileData.is_active) {
        setAccessBlockedReason("Your account is deactivated. Contact your administrator.");
        await signOutUser();
        if (!mounted) return;
        setProfile(null);
        return;
      }

      if (profileData && !profileData.is_super_admin && business?.is_frozen) {
        setAccessBlockedReason("Your business account is frozen. Contact system support.");
        await signOutUser();
        if (!mounted) return;
        setProfile(null);
        return;
      }

      if (!mounted) return;
      setAccessBlockedReason("");
      setProfile(profileData ? { ...profileData, business } : null);
    }

    async function loadSession() {
      try {
        const currentSession = await getSession();
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        await loadProfile(currentSession?.user?.id || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user || null);
      await loadProfile(currentSession?.user?.id || null);
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const isSuper = !!profile?.is_super_admin;
    if (!isSuper) {
      setActiveBusinessId(profile?.business_id || null);
      return;
    }

    const stored = globalThis.localStorage?.getItem("charitex.superAdmin.activeBusinessId");
    setActiveBusinessId(stored || profile?.business_id || null);
  }, [profile?.business_id, profile?.is_super_admin]);

  const setSuperAdminBusiness = (businessId) => {
    if (!profile?.is_super_admin) return;
    setActiveBusinessId(businessId || null);
    if (businessId) {
      globalThis.localStorage?.setItem("charitex.superAdmin.activeBusinessId", businessId);
    } else {
      globalThis.localStorage?.removeItem("charitex.superAdmin.activeBusinessId");
    }
  };

  const value = useMemo(
    () => {
      const normalizedRole = String(profile?.role || "").trim().toLowerCase();

      return {
      user,
      session,
      profile,
      businessId: activeBusinessId || null,
      ownBusinessId: profile?.business_id || null,
      role: normalizedRole || null,
      isAdmin: normalizedRole === "admin",
      isStaff: normalizedRole === "staff",
      isSuperAdmin: !!profile?.is_super_admin,
      accessBlockedReason,
      setSuperAdminBusiness,
      loading,
      signIn: signInWithEmail,
      signOut: signOutUser,
      isAuthenticated: !!user,
    };
    },
    [user, session, profile, activeBusinessId, loading, accessBlockedReason]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
