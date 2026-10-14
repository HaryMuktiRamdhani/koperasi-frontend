import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, School, Users, Package, ReceiptText,
  Wallet, LogOut, UserCog,
} from "lucide-react";

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
  const navigate = useNavigate();
  let role = "";
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) role = (JSON.parse(storedUser) as { role?: string }).role || "";
  } catch {
    role = "";
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[var(--sidebar-background)] px-4 py-6 text-[var(--sidebar-text)]">
      <div className="mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-sm">
            <span className="text-sm font-bold tracking-wide text-[var(--accent-contrast)]">KS</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide">Koperasi Sekolah</h2>
            <p className="mt-0.5 text-xs text-[var(--sidebar-muted)]">Panel administrasi</p>
          </div>
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
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-[var(--accent-border)] bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] shadow-sm"
                    : "border-transparent text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
                ].join(" ")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--sidebar-border)] pt-5">
        <div className="mb-4 rounded-lg bg-[var(--sidebar-card)] px-3 py-3 text-xs text-[var(--sidebar-muted)]">
          <p className="font-medium text-[var(--sidebar-text)]">Ruang kerja koperasi</p>
          <p className="mt-1 leading-relaxed">Kelola administrasi sekolah dengan rapi.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
