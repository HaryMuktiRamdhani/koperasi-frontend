export type AppRole = "admin" | "staff";

export function getStoredRole(): AppRole | "" {
  try {
    const storedUser = localStorage.getItem("user");
    const role = storedUser
      ? (JSON.parse(storedUser) as { role?: string }).role
      : "";
    return role === "admin" || role === "staff" ? role : "";
  } catch {
    return "";
  }
}

export function isAdmin() {
  return getStoredRole() === "admin";
}
