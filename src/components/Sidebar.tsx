import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  School,
  Users,
  Package,
  ReceiptText,
  Wallet,
  LogOut,
} from "lucide-react";

export const menuItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/jurusan",
    label: "Jurusan",
    icon: GraduationCap,
  },
  {
    to: "/classes",
    label: "Kelas",
    icon: School,
  },
  {
    to: "/students",
    label: "Siswa",
    icon: Users,
  },
  {
    to: "/items",
    label: "Barang",
    icon: Package,
  },
  {
    to: "/bills",
    label: "Tagihan",
    icon: ReceiptText,
  },
  {
    to: "/payments",
    label: "Pembayaran",
    icon: Wallet,
  },
] as const;

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-[#102a43] px-4 py-6 text-white">
      <div className="mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b2aa] shadow-sm">
            <span className="text-sm font-bold tracking-wide text-[#102a43]">KS</span>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white">Koperasi Sekolah</h2>
            <p className="mt-0.5 text-xs text-slate-300">Panel administrasi</p>
          </div>
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-[#42c7bd]/20 bg-[#20b2aa] font-semibold text-[#102a43] shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="mb-4 rounded-lg bg-white/5 px-3 py-3 text-xs text-slate-300">
          <p className="font-medium text-white">Ruang kerja koperasi</p>
          <p className="mt-1 leading-relaxed">Kelola administrasi sekolah dengan rapi.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;