import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, School, Users, Package, ReceiptText,
  Wallet, Settings, UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  const [compact, setCompact] = useState(() => localStorage.getItem("compactSidebar") === "true");
  let role = "";
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) role = (JSON.parse(storedUser) as { role?: string }).role || "";
  } catch {
    role = "";
  }

  useEffect(() => {
    function handleCompactChange(event: Event) {
      setCompact((event as CustomEvent<boolean>).detail);
    }

    window.addEventListener("compactSidebarChange", handleCompactChange);
    return () => window.removeEventListener("compactSidebarChange", handleCompactChange);
  }, []);

  return (
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col bg-(--sidebar-background) py-6 text-(--sidebar-text) ${compact ? "w-20 px-2" : "w-64 px-4"}`}>
      <div className={`mb-10 ${compact ? "px-1" : "px-2"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent) shadow-sm">
            <span className="text-sm font-bold tracking-wide text-(--accent-contrast)">KS</span>
          </div>
          {!compact && <div>
            <h2 className="text-sm font-semibold tracking-wide">Koperasi Sekolah</h2>
            <p className="mt-0.5 text-xs text-(--sidebar-muted)">Panel administrasi</p>
          </div>}
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1.5">
        {menuItems.filter((item) => !("adminOnly" in item) || role === "admin").map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : ""}`,
                  isActive
                    ? "border-(--accent-border) bg-(--accent) font-semibold text-[(--accent-contrast) shadow-sm"
                    : "border-transparent text-(--sidebar-muted)] hover:bg-(--sidebar-hover) hover:text-(--sidebar-text)",
                ].join(" ")
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
              {!compact && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-(--sidebar-border) pt-5">
        {!compact && <div className="mb-4 rounded-lg bg-(--sidebar-card) px-3 py-3 text-xs text-[(--sidebar-muted)">
          <p className="font-medium text-(--sidebar-text)">Ruang kerja koperasi</p>
          <p className="mt-1 leading-relaxed">Kelola administrasi sekolah dengan rapi.</p>
        </div>}
        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            [
              `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : ""}`,
              isActive
                ? "border-(--accent-border) bg-(--accent) font-semibold text-[(--accent-contrast) shadow-sm"
                : "border-transparent text-(--sidebar-muted)] hover:bg-(--sidebar-hover) hover:text-(--sidebar-text)",
            ].join(" ")
          }
          aria-label="Pengaturan"
        >
          <Settings className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
          {!compact && <span>Pengaturan</span>}
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;