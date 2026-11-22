
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  School,
  Users,
  Package,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  ReceiptText,
  Wallet,
  Settings,
  UserCog,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jurusan", label: "Jurusan", icon: GraduationCap },
  { to: "/classes", label: "Kelas", icon: School },
  { to: "/students", label: "Siswa", icon: Users },
  { to: "/barang-masuk", label: "Barang Masuk", icon: PackagePlus },
  { to: "/barang-keluar", label: "Barang Keluar", icon: PackageMinus },
  { to: "/opname", label: "Opname", icon: ClipboardCheck },
  { to: "/items", label: "Barang", icon: Package },
  { to: "/bills", label: "Tagihan", icon: ReceiptText },
  { to: "/payments", label: "Pembayaran", icon: Wallet },
  { to: "/users", label: "Pengguna", icon: UserCog, adminOnly: true },
] as const;

const sidebarGroups = [
  { label: "OVERVIEW", paths: ["/dashboard"] },
  {
    label: "DATA",
    paths: ["/jurusan", "/classes", "/students"],
  },
  {
    label: "PERSEDIAAN",
    paths: [
      "/barang-masuk",
      "/barang-keluar",
      "/opname",
      "/items",
    ],
  },
  { label: "TRANSAKSI", paths: ["/bills", "/payments"] },
  { label: "AKUN", paths: ["/users"] },
] as const;

function Sidebar() {
  const { appearance } = useTheme();
  const { t } = useLanguage();
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

  const navLinkClass = (isActive: boolean) =>
    [
      "relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
      compact ? "justify-center px-2" : "",
      isActive
        ? "border-transparent bg-white font-semibold text-teal-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-teal-600 dark:bg-teal-900/40 dark:text-teal-300 dark:before:bg-teal-400"
        : "border-transparent text-teal-50 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-teal-900/20 dark:hover:text-teal-300",
    ].join(" ");

  return (
    <aside
      className={`group/sidebar sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-teal-700 bg-teal-600 text-white dark:border-[#292929] dark:bg-[#111111] dark:text-slate-50 ${
        appearance.autoHideSidebar
          ? "w-16 hover:w-64"
          : compact
            ? "w-20"
            : "w-64"
      } ${compact ? "px-2" : "px-4"}`}
    >
      <div
        className={`flex h-45 shrink-0 flex-col items-center justify-center border-b border-white/20 text-center dark:border-[#292929] ${
          appearance.autoHideSidebar
            ? "group-hover/sidebar:border-white/30"
            : ""
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white dark:border-[#292929] dark:bg-[#171717] ${
            compact ? "h-14 w-14" : "h-20 w-20"
          }`}
        >
          <img
            src="/stokpedia.png"
            alt="Logo Stokpedia"
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
              Stokpedia
            </h2>
          </div>
        )}
      </div>

      <nav
        aria-label="Navigasi utama"
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pt-5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {sidebarGroups.map((group) => {
          const groupItems = menuItems.filter(
            (item) =>
              group.paths.some((path) => path === item.to) &&
              (!("adminOnly" in item) || role === "admin"),
          );

          if (!groupItems.length) return null;

          return (
            <div key={group.label} className="mb-3">
              {(!compact || appearance.autoHideSidebar) && (
                <p
                  className={`mb-1 px-3 text-[10px] font-semibold tracking-[0.16em] text-teal-100 dark:text-slate-500 ${
                    appearance.autoHideSidebar
                      ? "hidden group-hover/sidebar:block"
                      : ""
                  }`}
                >
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {groupItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => navLinkClass(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? "text-teal-800 dark:text-teal-300"
                                : "text-teal-50 dark:text-slate-300"
                            }`}
                          >
                            <Icon
                              className="h-4 w-4"
                              strokeWidth={1.8}
                            />
                          </span>

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
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/20 pt-5 dark:border-[#292929]">
        {appearance.showWorkspaceCard &&
          (!compact || appearance.autoHideSidebar) && (
            <div
              className={`mb-4 rounded-lg bg-white/10 px-3 py-3 text-xs text-teal-50 dark:bg-teal-900/20 dark:text-slate-300 ${
                appearance.autoHideSidebar
                  ? "hidden group-hover/sidebar:block"
                  : ""
              }`}
            >
              <p className="font-medium text-white dark:text-teal-200">
                Ruang kerja koperasi
              </p>
              <p className="mt-1 leading-relaxed">
                Kelola administrasi sekolah dengan rapi.
              </p>
            </div>
          )}

        {(!compact || appearance.autoHideSidebar) && (
          <p
            className={`mb-1 px-3 text-[10px] font-semibold tracking-[0.16em] text-teal-100 dark:text-slate-500 ${
              appearance.autoHideSidebar
                ? "hidden group-hover/sidebar:block"
                : ""
            }`}
          >
            PENGATURAN
          </p>
        )}

        {role === "admin" && (
          <NavLink
            to="/settings/profile"
            className={({ isActive }) => navLinkClass(isActive)}
            aria-label="Pengaturan"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-teal-900/40 dark:text-teal-300"
                      : "bg-white/10 text-teal-50 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Settings
                    className="h-4 w-4"
                    strokeWidth={1.8}
                  />
                </span>

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
              </>
            )}
          </NavLink>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
