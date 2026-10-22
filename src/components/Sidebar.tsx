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
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col bg-[#102a43] dark:bg-[#0f172a] py-6 text-white dark:text-slate-50 ${compact ? "w-20 px-2" : "w-64 px-4"}`}>
      <div className={`mb-10 ${compact ? "px-1" : "px-2"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b2aa] dark:bg-[#2dd4bf] shadow-sm">
            <span className="text-sm font-bold tracking-wide text-[#102a43] dark:text-[#0f172a]">KS</span>
          </div>
          {!compact && <div>
            <h2 className="text-sm font-semibold tracking-wide">Koperasi Sekolah</h2>
            <p className="mt-0.5 text-xs text-slate-300">Panel administrasi</p>
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
                    ? "border-teal-300 dark:border-teal-400 bg-[#20b2aa] dark:bg-[#2dd4bf] font-semibold text-[#102a43] dark:text-[#0f172a] shadow-sm"
                    : "border-transparent text-slate-300 hover:bg-white/10 dark:hover:bg-slate-400/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
              {!compact && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 dark:border-slate-400/20 pt-5">
        {!compact && <div className="mb-4 rounded-lg bg-white/5 dark:bg-slate-400/10 px-3 py-3 text-xs text-slate-300">
          <p className="font-medium text-white dark:text-slate-50">Ruang kerja koperasi</p>
          <p className="mt-1 leading-relaxed">Kelola administrasi sekolah dengan rapi.</p>
        </div>}
        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            [
              `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${compact ? "justify-center px-2" : ""}`,
              isActive
                ? "border-teal-300 dark:border-teal-400 bg-[#20b2aa] dark:bg-[#2dd4bf] font-semibold text-[#102a43] dark:text-[#0f172a] shadow-sm"
                : "border-transparent text-slate-300 hover:bg-white/10 dark:hover:bg-slate-400/10 hover:text-white",
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