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
    if (storedUser) {
      role = (JSON.parse(storedUser) as { role?: string }).role || "";
    }
  } catch {
    role = "";
  }

  const navLinkClass = (isActive: boolean) =>
    [
      "sidebar-link relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
      compact ? "justify-center px-2" : "",
      isActive
        ? "border-transparent bg-white font-semibold text-teal-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-teal-600 dark:bg-teal-900/40 dark:text-teal-300 dark:before:bg-teal-400"
        : "border-transparent text-teal-50 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-teal-900/20 dark:hover:text-teal-300",
    ].join(" ");

  const expandingTextClass = appearance.autoHideSidebar
    ? "sidebar-expanding-text max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-48 group-hover/sidebar:opacity-100"
    : "";

  return (
    <aside
      className={`group/sidebar sidebar-shell sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-teal-700 bg-teal-600 text-white dark:border-[#292929] dark:bg-[#111111] dark:text-slate-50 ${
        appearance.autoHideSidebar
          ? "w-16 hover:w-64"
          : compact
            ? "w-20"
            : "w-64"
      } ${compact ? "px-2" : "px-4"}`}
    >
      <style>{`
        .sidebar-shell {
          transition:
            width 320ms cubic-bezier(0.22, 1, 0.36, 1),
            padding 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sidebar-link {
          transition:
            background-color 200ms ease,
            color 200ms ease,
            border-color 200ms ease,
            transform 200ms ease;
        }

        .sidebar-link:hover {
          transform: translateX(2px);
        }

        .sidebar-link:active {
          transform: scale(0.98);
        }

        .sidebar-link span {
          transition:
            color 200ms ease,
            background-color 200ms ease;
        }

        .sidebar-expanding-text {
          display: inline-flex;
          transition:
            max-width 300ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 200ms ease;
        }

        .sidebar-brand {
          transition:
            height 300ms cubic-bezier(0.22, 1, 0.36, 1),
            width 300ms cubic-bezier(0.22, 1, 0.36, 1),
            border-radius 200ms ease;
        }

        .sidebar-logo {
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sidebar-shell:hover .sidebar-logo {
          transform: scale(1.04);
        }

        .sidebar-group {
          animation: sidebarFadeIn 350ms ease both;
        }

        @keyframes sidebarFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar-shell,
          .sidebar-link,
          .sidebar-link span,
          .sidebar-expanding-text,
          .sidebar-brand,
          .sidebar-logo,
          .sidebar-group {
            animation: none !important;
            transition: none !important;
          }

          .sidebar-link:hover,
          .sidebar-link:active {
            transform: none !important;
          }
        }
      `}</style>

      {/* Logo dan Nama Aplikasi */}
      <div
        className={`flex h-45 shrink-0 flex-col items-center justify-center border-b border-white/20 text-center dark:border-[#292929] ${
          appearance.autoHideSidebar
            ? "group-hover/sidebar:border-white/30"
            : ""
        }`}
      >
        <div
          className={`sidebar-brand flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white dark:border-[#292929] dark:bg-[#171717] ${
            compact ? "h-14 w-14" : "h-20 w-20"
          }`}
        >
          <img
            src="/stokpedia.png"
            alt="Logo Stokpedia"
            className="sidebar-logo h-full w-full object-contain p-1.5"
          />
        </div>

        {(!compact || appearance.autoHideSidebar) && (
          <div
            className={
              appearance.autoHideSidebar
                ? "sidebar-expanding-text mt-3 max-h-8"
                : ""
            }
          >
            <h2 className="max-w-47.5 truncate text-sm font-semibold tracking-wide">
              Stokpedia
            </h2>
          </div>
        )}
      </div>

      {/* Navigasi */}
      <nav
        aria-label="Navigasi utama"
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pt-5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {sidebarGroups.map((group, groupIndex) => {
          const groupItems = menuItems.filter(
            (item) =>
              group.paths.some((path) => path === item.to) &&
              (!("adminOnly" in item) || role === "admin"),
          );

          if (!groupItems.length) return null;

          return (
            <div
              key={group.label}
              className="sidebar-group mb-3"
              style={{
                animationDelay: `${groupIndex * 45}ms`,
              }}
            >
              {(!compact || appearance.autoHideSidebar) && (
                <p
                  className={`mb-1 px-3 text-[10px] font-semibold tracking-[0.16em] text-teal-100 dark:text-slate-500 ${
                    appearance.autoHideSidebar
                      ? "sidebar-expanding-text"
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
                                  ? expandingTextClass
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

      {/* Bagian Bawah Sidebar */}
      <div className="mt-auto border-t border-white/20 pt-5 dark:border-[#292929]">
        {appearance.showWorkspaceCard &&
          (!compact || appearance.autoHideSidebar) && (
            <div
              className={`mb-4 rounded-lg bg-white/10 px-3 py-3 text-xs text-teal-50 dark:bg-teal-900/20 dark:text-slate-300 ${
                appearance.autoHideSidebar
                  ? "sidebar-expanding-text"
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
                ? "sidebar-expanding-text"
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
                        ? expandingTextClass
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