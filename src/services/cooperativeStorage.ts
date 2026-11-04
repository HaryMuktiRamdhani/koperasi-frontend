export interface CooperativeProfile {
  name: string;
  subtitle: string;
  logoUrl: string | null;
}

export const DEFAULT_COOPERATIVE_PROFILE: CooperativeProfile = {
  name: "Koperasi Sekolah",
  subtitle: "KOPERASI SEKOLAH",
  logoUrl: null,
};
