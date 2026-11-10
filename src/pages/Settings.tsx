import {
  Languages,
  LockKeyhole,
  LogOut,
  MonitorCog,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import PageHeader from "../components/settings/PageHeader";
import ProfileSettings from "../components/settings/ProfileSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import LanguageSettings from "../components/settings/LanguageSettings";
import { useLanguage } from "../context/LanguageContext";
import SecuritySettings from "../components/settings/SecuritySettings";
import ActiveSessionsSettings from "../components/settings/ActiveSessionsSettings";
import api from "../services/api";

type SettingsRoute =
  | "profile"
  | "security"
  | "sessions"
  | "appearance"
  | "language";

interface SettingsMenuItem {
  id: SettingsRoute;
  label: string;
  icon: LucideIcon;
}

interface SettingsGroup {
  label: string;
  items: SettingsMenuItem[];
}

const groups: SettingsGroup[] = [
  {
    label: "Akun",
    items: [
      { id: "profile", label: "Profil", icon: UserRound },
      { id: "security", label: "Keamanan", icon: LockKeyhole },
      { id: "sessions", label: "Sesi Aktif", icon: ShieldCheck },
    ],
  },
  {
    label: "Aplikasi",
    items: [
      { id: "appearance", label: "Tampilan", icon: MonitorCog },
      { id: "language", label: "Bahasa & Regional", icon: Languages },
    ],
  },
];

const routeDetails: Record<SettingsRoute, { title: string; description: string; icon: LucideIcon }> = {
  profile: { title: "Profil", description: "Kelola informasi akun pengguna.", icon: UserRound },
  security: { title: "Keamanan", description: "Pengaturan keamanan akun dan autentikasi.", icon: LockKeyhole },
  sessions: { title: "Sesi Aktif", description: "Kelola perangkat yang sedang menggunakan akun.", icon: ShieldCheck },
  appearance: { title: "Tampilan", description: "Preferensi tema dan tampilan aplikasi.", icon: MonitorCog },
  language: { title: "Bahasa & Regional", description: "Bahasa, format tanggal, dan preferensi regional.", icon: Languages },
};

const routeIds = groups.flatMap((group) => group.items.map((item) => item.id));
function Settings() {
  const { t } = useLanguage();
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const activeSection = routeIds.includes(section as SettingsRoute) ? section as SettingsRoute : null;

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear local credentials even when the session is already unavailable.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  }

  if (!activeSection) return <Navigate to="/settings/profile" replace />;
  const detail = routeDetails[activeSection];
  const Icon = detail.icon;

  return (
    <div className="w-full">
      <PageHeader title={t("settings")} description={t("settingsDescription")} icon={SettingsIcon} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 dark:border-[#263449] dark:bg-[#111c2e]">
          <nav aria-label="Navigasi pengaturan" className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={`/settings/${item.id}`}
                        className={({ isActive }) => `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                          isActive
                            ? "bg-[#e8f7f5] font-semibold text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-[#102a43] dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d] dark:hover:text-slate-100"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" strokeWidth={1.8} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <button type="button" onClick={handleLogout} className="mt-4 flex w-full cursor-pointer items-center gap-3 rounded-lg border-t border-slate-200 px-3 pt-4 text-sm font-medium text-red-600 hover:text-red-700 dark:border-[#263449] dark:text-red-300 dark:hover:text-red-200">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </aside>

        <main className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 dark:border-[#263449] dark:bg-[#111c2e] sm:p-8">
          <div className="flex items-start gap-3 border-b border-slate-200 pb-5 dark:border-[#263449]">
            <Icon className="mt-1 h-5 w-5 shrink-0 text-[#168b87]" strokeWidth={1.8} />
            <div>
              <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">{detail.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{detail.description}</p>
            </div>
          </div>
          <div className="pt-6">
            {activeSection === "profile" ? <ProfileSettings /> : activeSection === "security" ? <SecuritySettings /> : activeSection === "sessions" ? <ActiveSessionsSettings /> : activeSection === "appearance" ? <AppearanceSettings /> : <LanguageSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
