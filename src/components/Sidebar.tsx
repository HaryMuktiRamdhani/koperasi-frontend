import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  School,
  Users,
  Package,
  ReceiptText,
  Wallet,
  Settings,
  UserCog,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useCooperative } from "../context/CooperativeContext";

export const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jurusan", label: "Jurusan", icon: GraduationCap },
  { to: "/classes", label: "Kelas", icon: School },
  { to: "/students", label: "Siswa", icon: Users },
  { to: "/items", label: "Barang", icon: Package },
  { to: "/bills", label: "Tagihan", icon: ReceiptText },
  { to: "/payments", label: "Pembayaran", icon: Wallet },
  { to: "/users", label: "Pengguna", icon: UserCog, adminOnly: true },
] as const;

function Sidebar() {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const { profile } = useCooperative();
  const compact = appearance.compactSidebar || appearance.autoHideSidebar;
  const labels: Record<string, string> = {
    "/dashboard": t("dashboard"),
    "/jurusan": t("majors"),
    "/classes": t("classes"),
    "/students": t("students"),
    "/items": t("items"),
    "/bills": t("bills"),
    "/payments": t("payments"),
    "/users": t("users"),
  };
  let role = "";
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser)
      role = (JSON.parse(storedUser) as { role?: string }).role || "";
  } catch {
    role = "";
  }

  return (
    <aside
      className={`group/sidebar sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden bg-white text-[#102a43] dark:bg-[#0f172a] dark:text-slate-50 ${appearance.autoHideSidebar ? "w-16 hover:w-64" : compact ? "w-20" : "w-64"} ${compact ? "px-2" : "px-4"}`}
    >
      <div
        className={`flex h-45 shrink-0 flex-col items-center justify-center border-b border-slate-200 text-center dark:border-[#263449] ${appearance.autoHideSidebar ? "group-hover/sidebar:border-slate-400" : ""}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#263449] dark:bg-[#1b2a3d] ${compact ? "h-14 w-14" : "h-20 w-20"}`}
        >
          <img
            src={profile.logoUrl || "/logo%20smk%201%20cisarua%20remove%20bg.png"}
            alt={`Logo ${profile.name}`}
            className="h-full w-full object-contain p-1.5"
          />
        </div>
        {(!compact || appearance.autoHideSidebar) && (
          <div
            className={
              appearance.autoHideSidebar
                ? "hidden group-hover/sidebar:block"
                : ""
            }
          >
            <h2 className="mt-3 max-w-47.5 truncate text-sm font-semibold tracking-wide">
              {profile.name}
            </h2>
            <p className="mt-1 max-w-47.5 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              {profile.subtitle}
            </p>
          </div>
        )}
      </div>

      <nav
        aria-label="Navigasi utama"
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pt-5"
      >
        {menuItems
          .filter((item) => !("adminOnly" in item) || role === "admin")
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : ""}`,
                    isActive
                      ? "border-teal-300 dark:border-teal-400 bg-[#20b2aa] dark:bg-[#2dd4bf] font-semibold text-[#102a43] dark:text-[#0f172a] shadow-sm"
                      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-[#102a43] dark:text-slate-300 dark:hover:bg-slate-400/10 dark:hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
                {(!compact || appearance.autoHideSidebar) && (
                  <span
                    className={
                      appearance.autoHideSidebar
                        ? "hidden group-hover/sidebar:inline"
                        : ""
                    }
                  >
                    {labels[item.to] || item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
      </nav>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-400/20 pt-5">
        {appearance.showWorkspaceCard &&
          (!compact || appearance.autoHideSidebar) && (
            <div
              className={`mb-4 rounded-lg bg-slate-100 px-3 py-3 text-xs text-slate-600 dark:bg-slate-400/10 dark:text-slate-300 ${appearance.autoHideSidebar ? "hidden group-hover/sidebar:block" : ""}`}
            >
              <p className="font-medium text-[#102a43] dark:text-slate-50">
                Ruang kerja koperasi
              </p>
              <p className="mt-1 leading-relaxed">
                Kelola administrasi sekolah dengan rapi.
              </p>
            </div>
          )}
        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            [
              `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : ""}`,
              isActive
                ? "border-teal-300 dark:border-teal-400 bg-[#20b2aa] dark:bg-[#2dd4bf] font-semibold text-[#102a43] dark:text-[#0f172a] shadow-sm"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-[#102a43] dark:text-slate-300 dark:hover:bg-slate-400/10 dark:hover:text-white",
            ].join(" ")
          }
          aria-label="Pengaturan"
        >
          <Settings className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
          {(!compact || appearance.autoHideSidebar) && (
            <span
              className={
                appearance.autoHideSidebar
                  ? "hidden group-hover/sidebar:inline"
                  : ""
              }
            >
              {t("settings")}
            </span>
          )}
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
