import {
  Archive,
  Building2,
  CircleHelp,
  FileText,
  Languages,
  LockKeyhole,
  LogOut,
  MonitorCog,
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCog,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import EmptyState from "../components/settings/EmptyState";
import PageHeader from "../components/settings/PageHeader";
import ProfileSettings from "../components/settings/ProfileSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import LanguageSettings from "../components/settings/LanguageSettings";
import { useLanguage } from "../context/LanguageContext";
import CooperativeProfileSettings from "../components/settings/CooperativeProfileSettings";
import IconBadge, { type IconTone } from "../components/IconBadge";
import SecuritySettings from "../components/settings/SecuritySettings";
import ActiveSessionsSettings from "../components/settings/ActiveSessionsSettings";
import api from "../services/api";

type SettingsRoute =
  | "profile"
  | "security"
  | "sessions"
  | "appearance"
  | "language"
  | "notifications"
  | "identity"
  | "finance"
  | "payment-methods"
  | "users"
  | "roles"
  | "audit-log"
  | "help"
  | "about";

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
      { id: "notifications", label: "Notifikasi", icon: CircleHelp },
    ],
  },
  {
    label: "Koperasi",
    items: [
      { id: "identity", label: "Identitas Koperasi", icon: Building2 },
      { id: "finance", label: "Keuangan", icon: WalletCards },
      { id: "payment-methods", label: "Metode Pembayaran", icon: ReceiptText },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { id: "users", label: "Pengguna", icon: UserCog },
      { id: "roles", label: "Peran & Hak Akses", icon: UsersRound },
      { id: "audit-log", label: "Log Aktivitas", icon: FileText },
    ],
  },
  {
    label: "Bantuan",
    items: [
      { id: "help", label: "Bantuan & Dukungan", icon: CircleHelp },
      { id: "about", label: "Tentang Aplikasi", icon: Archive },
    ],
  },
];

const routeDetails: Record<SettingsRoute, { title: string; description: string; icon: LucideIcon }> = {
  profile: { title: "Profil", description: "Kelola informasi akun pengguna.", icon: UserRound },
  security: { title: "Keamanan", description: "Pengaturan keamanan akun dan autentikasi.", icon: LockKeyhole },
  sessions: { title: "Sesi Aktif", description: "Kelola perangkat yang sedang menggunakan akun.", icon: ShieldCheck },
  appearance: { title: "Tampilan", description: "Preferensi tema dan tampilan aplikasi.", icon: MonitorCog },
  language: { title: "Bahasa & Regional", description: "Bahasa, format tanggal, dan preferensi regional.", icon: Languages },
  notifications: { title: "Notifikasi", description: "Preferensi pemberitahuan aplikasi.", icon: CircleHelp },
  identity: { title: "Identitas Koperasi", description: "Informasi identitas dan profil koperasi.", icon: Building2 },
  finance: { title: "Keuangan", description: "Preferensi dan konfigurasi keuangan koperasi.", icon: WalletCards },
  "payment-methods": { title: "Metode Pembayaran", description: "Pengaturan metode pembayaran yang tersedia.", icon: ReceiptText },
  users: { title: "Pengguna", description: "Pengaturan pengelolaan pengguna aplikasi.", icon: UserCog },
  roles: { title: "Peran & Hak Akses", description: "Pengaturan peran dan hak akses pengguna.", icon: UsersRound },
  "audit-log": { title: "Log Aktivitas", description: "Riwayat aktivitas administrasi aplikasi.", icon: FileText },
  help: { title: "Bantuan & Dukungan", description: "Petunjuk dan dukungan penggunaan aplikasi.", icon: CircleHelp },
  about: { title: "Tentang Aplikasi", description: "Informasi versi dan sistem aplikasi.", icon: Archive },
};

const routeIds = groups.flatMap((group) => group.items.map((item) => item.id));
const settingsIconTones: Record<SettingsRoute, IconTone> = {
  profile: "blue", security: "red", sessions: "cyan", appearance: "violet", language: "blue", notifications: "orange",
  identity: "teal", finance: "green", "payment-methods": "orange", users: "cyan", roles: "violet", "audit-log": "slate", help: "orange", about: "slate",
};

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
                        <IconBadge icon={ItemIcon} tone={settingsIconTones[item.id]} className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
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
            <IconBadge icon={Icon} tone={settingsIconTones[activeSection]} />
            <div>
              <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">{detail.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{detail.description}</p>
            </div>
          </div>
          <div className="pt-6">
            {activeSection === "profile" ? <ProfileSettings /> : activeSection === "security" ? <SecuritySettings /> : activeSection === "sessions" ? <ActiveSessionsSettings /> : activeSection === "appearance" ? <AppearanceSettings /> : activeSection === "language" ? <LanguageSettings /> : activeSection === "identity" ? <CooperativeProfileSettings /> : <EmptyState title={detail.title} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
