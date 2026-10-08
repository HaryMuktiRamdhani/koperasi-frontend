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

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const menuItems = [
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
  ];

  return (
    <aside className="flex min-h-screen w-60 flex-col border-r border-gray-200 bg-white px-3 py-5">
      {/* Logo */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-900">
            <span className="text-sm font-semibold text-white">
              KS
            </span>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Koperasi
            </h2>

            <p className="text-xs text-gray-500">
              Sekolah
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                  isActive
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;