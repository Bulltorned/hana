"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tenant, Profile } from "@/lib/types";

/**
 * Hook to manage tenant context.
 * - Operator: can select any tenant, sees all tenants
 * - Client HRD: automatically scoped to their assigned tenant
 */
export function useTenantContext() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    const supabase = createClient();

    // Get current user's profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    if (profileData?.role === "operator") {
      // Operator sees all tenants
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      setTenants(tenantData ?? []);

      // Auto-select first tenant if none selected
      if (!selectedTenantId && tenantData && tenantData.length > 0) {
        setSelectedTenantId(tenantData[0].id);
      }
    } else if (profileData?.tenant_id) {
      // Client HRD is scoped to their tenant
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profileData.tenant_id)
        .single();

      if (tenantData) {
        setTenants([tenantData]);
        setSelectedTenantId(tenantData.id);
      }
    }

    setLoading(false);
  }, [selectedTenantId]);

  useEffect(() => {
    fetchContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOperator = profile?.role === "operator";
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return {
    tenants,
    selectedTenantId,
    selectedTenant,
    setSelectedTenantId,
    profile,
    isOperator,
    loading,
    refetchTenants: fetchContext,
  };
}
