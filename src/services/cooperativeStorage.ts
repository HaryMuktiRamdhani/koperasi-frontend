export interface CooperativeProfile {
  name: string;
  subtitle: string;
  logoUrl: string | null;
}

export const DEFAULT_COOPERATIVE_PROFILE: CooperativeProfile = {
  name: "Stokpedia",
  subtitle: "Stokpedia",
  logoUrl: null,
};
