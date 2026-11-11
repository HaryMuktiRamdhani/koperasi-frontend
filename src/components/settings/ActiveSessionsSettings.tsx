import { useEffect, useState } from "react";
import {
  Clock3,
  Globe2,
  Laptop,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import api from "../../services/api";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import SettingSection from "./SettingSection";

interface SessionItem {
  id: string;
  deviceName?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  lastActivityAt?: string | null;
  endedAt?: string | null;
  status: "active" | "revoked" | "expired";
  isCurrent?: boolean;
}

interface SessionUser {
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "Tidak diketahui";
}

function getError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

function DeviceIcon({ device }: { device?: string | null }) {
  return /phone|iphone|android|tablet/i.test(device || "") ? (
    <Smartphone className="h-5 w-5" />
  ) : (
    <Laptop className="h-5 w-5" />
  );
}

function SessionCard({
  session,
  user,
  onRevoke,
}: {
  session: SessionItem;
  user: SessionUser;
  onRevoke: (session: SessionItem) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-[#263449]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-50 text-[#168b87] dark:bg-teal-950/40 dark:text-teal-300">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <DeviceIcon device={session.deviceName} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[#102a43] dark:text-slate-100">
              {session.deviceName || "Perangkat tidak diketahui"}
            </h3>
            {session.isCurrent && (
              <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                Perangkat ini
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Aktif
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#a7b4c7]">
            {user.name}
            {user.username ? ` · @${user.username}` : ""}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-[#a7b4c7] sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              {session.browser || "Tidak diketahui"} ·{" "}
              {session.operatingSystem || "Tidak diketahui"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              IP {session.ipAddress || "Tidak diketahui"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Login {formatDate(session.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Aktivitas terakhir {formatDate(session.lastActivityAt)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRevoke(session)}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            {session.isCurrent
              ? "Logout perangkat ini"
              : "Keluar dari perangkat"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveSessionsSettings() {
  const [user, setUser] = useState<SessionUser>({ name: "" });
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<SessionItem | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  async function load() {
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        api.get<{ user: SessionUser; sessions: SessionItem[] }>(
          "/profile/sessions",
        ),
        api.get<SessionItem[]>("/profile/sessions/history"),
      ]);
      setUser(activeResponse.data.user);
      setSessions(activeResponse.data.sessions);
      setHistory(historyResponse.data);
    } catch (loadError) {
      setError(getError(loadError, "Gagal memuat sesi aktif."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function revoke(session: SessionItem) {
    try {
      if (session.isCurrent) {
        await api.post("/auth/logout");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.assign("/");
        return;
      }
      await api.delete(`/profile/sessions/${session.id}`);
      setConfirm(null);
      await load();
    } catch (revokeError) {
      setError(getError(revokeError, "Gagal mencabut sesi."));
    }
  }

  async function revokeOthers() {
    try {
      await api.delete("/profile/sessions");
      setConfirmAll(false);
      await load();
    } catch (revokeError) {
      setError(getError(revokeError, "Gagal mencabut sesi perangkat lain."));
    }
  }

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-[#a7b4c7]">
        Memuat sesi...
      </p>
    );
  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      <SettingSection
        title="Sesi aktif"
        description="Perangkat yang saat ini memiliki akses ke akun Anda. Refresh dan navigasi tidak membuat sesi baru."
      >
        {sessions.length === 0 ? (
          <EmptyState
            title="Tidak ada sesi aktif"
            description="Login ulang untuk membuat sesi baru."
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                user={user}
                onRevoke={setConfirm}
              />
            ))}
          </div>
        )}
        {sessions.filter((session) => !session.isCurrent).length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmAll(true)}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Keluar dari semua perangkat lain
          </button>
        )}
      </SettingSection>
      <SettingSection
        title="Riwayat sesi"
        description="Sesi yang telah logout, dicabut, atau berakhir karena timeout."
      >
        {history.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat sesi"
            description="Riwayat akan muncul setelah sesi berakhir."
          />
        ) : (
          <div className="space-y-2">
            {history.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-[#263449] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-[#102a43] dark:text-slate-100">
                      {session.deviceName || "Perangkat tidak diketahui"} ·{" "}
                      {session.browser || "Tidak diketahui"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                      Login {formatDate(session.createdAt)} · Berakhir{" "}
                      {formatDate(session.endedAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${session.status === "expired" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  {session.status === "expired" ? "Kedaluwarsa" : "Dicabut"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SettingSection>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Cabut sesi ini?"
        description="Perangkat tersebut akan langsung kehilangan akses dan tokennya tidak dapat digunakan kembali."
        confirmLabel="Cabut sesi"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && void revoke(confirm)}
      />
      <ConfirmDialog
        open={confirmAll}
        title="Keluar dari semua perangkat lain?"
        description="Semua sesi selain perangkat ini akan dicabut."
        confirmLabel="Keluar dari perangkat lain"
        onCancel={() => setConfirmAll(false)}
        onConfirm={() => void revokeOthers()}
      />
    </div>
  );
}

export default ActiveSessionsSettings;
