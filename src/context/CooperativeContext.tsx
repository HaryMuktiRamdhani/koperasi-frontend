import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_COOPERATIVE_PROFILE,
  type CooperativeProfile,
} from "../services/cooperativeStorage";
import api from "../services/api";

interface CooperativeContextValue {
  profile: CooperativeProfile;
  loading: boolean;
  updateProfile: (
    changes: Partial<CooperativeProfile>,
    logoData?: string | null,
  ) => Promise<void>;
}

const CooperativeContext = createContext<CooperativeContextValue | undefined>(
  undefined,
);

function resolveLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl || /^https?:\/\//.test(logoUrl)) return logoUrl;
  const baseUrl = api.defaults.baseURL || window.location.origin;
  return new URL(logoUrl, baseUrl).toString();
}

export function CooperativeProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(DEFAULT_COOPERATIVE_PROFILE);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get<CooperativeProfile>("/cooperative-profile")
      .then((response) =>
        setProfile({
          ...response.data,
          logoUrl: resolveLogoUrl(response.data.logoUrl),
        }),
      )
      .catch((error) => console.error("Gagal memuat identitas koperasi", error))
      .finally(() => setLoading(false));
  }, []);
  const value = useMemo(
    () => ({
      profile,
      loading,
      updateProfile: async (
        changes: Partial<CooperativeProfile>,
        logoData: string | null | undefined,
      ) => {
        const response = await api.patch<{ data: CooperativeProfile }>(
          "/cooperative-profile",
          {
            name: changes.name,
            subtitle: changes.subtitle,
            ...(logoData !== undefined ? { logoData } : {}),
          },
        );
        setProfile({
          ...response.data.data,
          logoUrl: resolveLogoUrl(response.data.data.logoUrl),
        });
      },
    }),
    [loading, profile],
  );
  return (
    <CooperativeContext.Provider value={value}>
      {children}
    </CooperativeContext.Provider>
  );
}

export function useCooperative() {
  const context = useContext(CooperativeContext);
  if (!context)
    throw new Error(
      "useCooperative harus digunakan di dalam CooperativeProvider.",
    );
  return context;
}
