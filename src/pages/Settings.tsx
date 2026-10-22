import { useEffect, useMemo, useState } from "react";
import {
  CircleHelp,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  Shield,
  Sun,
  UserRound,
  Wrench,
} from "lucide-react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

type SettingsSection = "profile" | "appearance" | "help" | "tools";

interface AuthUser {
  name?: string;
  email?: string;
  role?: string;
}

const sections: {
  id: SettingsSection;
  label: string;
  icon: typeof UserRound;
}[] = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "appearance", label: "Tampilan", icon: SettingsIcon },
  { id: "help", label: "Bantuan & Dukungan", icon: CircleHelp },
  { id: "tools", label: "Tools & Fitur Lainnya", icon: Wrench },
];

function getUser(): AuthUser {
  try {
    const stored = localStorage.getItem("user");
    const value: unknown = stored ? JSON.parse(stored) : null;
    if (!value || typeof value !== "object") return {};
    const user = value as Record<string, unknown>;
    return {
      name: typeof user.name === "string" ? user.name : undefined,
      email: typeof user.email === "string" ? user.email : undefined,
      role: typeof user.role === "string" ? user.role : undefined,
    };
  } catch {
    return {};
  }
}

function getInitials(user: AuthUser) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "KS";
  const words = source.split(/\s+/).filter(Boolean);
  return (
    words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)
  ).toUpperCase();
}

function Settings() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = useMemo(getUser, []);
  const activeSection = sections.some((item) => item.id === section)
    ? (section as SettingsSection)
    : null;
  const [compactSidebar, setCompactSidebar] = useState(
    () => localStorage.getItem("compactSidebar") === "true",
  );

  useEffect(() => {
    if (!activeSection) navigate("/settings/profile", { replace: true });
  }, [activeSection, navigate]);

  function updateCompactSidebar(value: boolean) {
    setCompactSidebar(value);
    localStorage.setItem("compactSidebar", String(value));
    window.dispatchEvent(
      new CustomEvent("compactSidebarChange", { detail: value }),
    );
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  if (!activeSection) return <Navigate to="/settings/profile" replace />;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">
          Pengaturan
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
          Kelola profil dan preferensi aplikasi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Kategori pengaturan"
          className="h-fit rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-2"
        >
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/settings/${item.id}`}
                className={({ isActive }) =>
                  [
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    isActive
                      ? "bg-slate-50 dark:bg-[#1b2a3d] font-semibold text-[#168b87]"
                      : "text-slate-500 dark:text-[#a7b4c7] hover:bg-slate-50 dark:hover:bg-[#1b2a3d] dark:bg-[#1b2a3d] hover:text-[#102a43] dark:text-slate-100",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <section className="min-w-0 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-5 sm:p-7">
          {activeSection === "profile" && (
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#20b2aa] dark:bg-[#2dd4bf] text-3xl font-semibold text-[#102a43] dark:text-[#0f172a]">
                {getInitials(user)}
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[#102a43] dark:text-slate-100">
                {user.name || "Nama belum tersedia"}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
                {user.email || "Email belum tersedia"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-[#1b2a3d] px-3 py-1 text-xs font-semibold text-slate-500 dark:text-[#a7b4c7]">
                <Shield className="h-3.5 w-3.5" />{" "}
                {user.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Pengguna"}
              </span>
              <div className="mt-8 border-t border-slate-200 dark:border-[#263449] pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4" /> Keluar dari akun
                </button>
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div>
              <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">
                Tampilan
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
                Preferensi ini disimpan di perangkat ini.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { value: "light" as const, label: "Mode terang", icon: Sun },
                  { value: "dark" as const, label: "Mode gelap", icon: Moon },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      aria-pressed={selected}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-left ${selected ? "border-[#20b2aa] bg-slate-50 dark:bg-[#1b2a3d]" : "border-slate-200 dark:border-[#263449] hover:bg-slate-50 dark:hover:bg-[#1b2a3d] dark:bg-[#1b2a3d]"}`}
                    >
                      <Icon className="h-5 w-5 text-[#168b87]" />
                      <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 border-t border-slate-200 dark:border-[#263449] pt-5">
                <span>
                  <span className="block text-sm font-semibold text-[#102a43] dark:text-slate-100">
                    Mode sidebar ringkas
                  </span>
                  <span className="mt-1 block text-sm text-slate-500 dark:text-[#a7b4c7]">
                    Sembunyikan label sidebar dan simpan preferensi secara
                    lokal.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={compactSidebar}
                  onChange={(event) =>
                    updateCompactSidebar(event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer accent-[#168b87]"
                />
              </label>
            </div>
          )}

          {activeSection === "help" && (
            <div>
              <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">
                Bantuan & Dukungan
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
                Petunjuk singkat penggunaan aplikasi.
              </p>
              <div className="mt-5 space-y-3 text-sm text-slate-500 dark:text-[#a7b4c7]">
                <p>
                  Gunakan menu sidebar untuk berpindah antara data koperasi
                  seperti siswa, barang, tagihan, dan pembayaran.
                </p>
                <p>
                  Gunakan pencarian pada header untuk menemukan menu atau data
                  yang tersedia.
                </p>
                <p>
                  Pengaturan tampilan dapat diubah melalui kategori Tampilan dan
                  tersimpan di browser ini.
                </p>
              </div>
            </div>
          )}

          {activeSection === "tools" && (
            <div>
              <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">
                Tools & Fitur Lainnya
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
                Area fitur tambahan administrasi koperasi.
              </p>
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 dark:border-[#263449] p-5 text-sm text-slate-500 dark:text-[#a7b4c7]">
                Fitur tambahan belum tersedia.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Settings;
