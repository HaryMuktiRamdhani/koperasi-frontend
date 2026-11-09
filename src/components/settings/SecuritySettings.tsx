import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import QRCode from "qrcode";
import {
  Copy,
  Download,
  KeyRound,
  Lock,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import ConfirmDialog from "./ConfirmDialog";
import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";
import Toggle from "./Toggle";

type Policy = {
  maxFailedAttempts: number;
  lockoutMinutes: number;
  pwMinLength: number;
  pwRequireLetterNumber: boolean;
  pwRequireSpecial: boolean;
};

type HistoryItem = {
  id: string;
  ip: string | null;
  deviceLabel: string | null;
  status: "success" | "failed" | "locked" | "2fa_failed";
  createdAt: string;
};
const defaultPolicy: Policy = {
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
  pwMinLength: 8,
  pwRequireLetterNumber: true,
  pwRequireSpecial: false,
};

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  const statuses = {
    success: [
      "Aktif",
      ShieldCheck,
      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    ],
    failed: [
      "Gagal",
      XCircle,
      "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    ],
    locked: [
      "Terkunci",
      Lock,
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    ],
    "2fa_failed": [
      "Gagal 2FA",
      XCircle,
      "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    ],
  } as const;
  const [label, Icon, className] = statuses[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function SecuritySettings() {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [savedPolicy, setSavedPolicy] = useState<Policy>(defaultPolicy);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2>(0);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  const policyDirty = JSON.stringify(policy) !== JSON.stringify(savedPolicy);
  const historyPages = Math.max(1, Math.ceil(historyTotal / 20));
  const rulePreview = useMemo(
    () =>
      [
        `Minimal ${policy.pwMinLength} karakter`,
        policy.pwRequireLetterNumber ? "Mengandung huruf dan angka" : "",
        policy.pwRequireSpecial ? "Mengandung karakter khusus" : "",
      ].filter(Boolean),
    [policy],
  );

  useEffect(() => {
    try {
      setIsAdmin(
        JSON.parse(localStorage.getItem("user") || "{}").role === "admin",
      );
    } catch {
      setIsAdmin(false);
    }
    void Promise.all([
      api.get("/security/settings"),
      api.get<Policy>("/security/policy"),
    ])
      .then(([settings, policyResponse]) => {
        setTotpEnabled(settings.data.totpEnabled);
        setSessionTimeout(settings.data.sessionTimeoutMinutes);
        setPolicy(policyResponse.data);
        setSavedPolicy(policyResponse.data);
      })
      .catch((loadError) =>
        setError(errorMessage(loadError, "Gagal memuat pengaturan keamanan.")),
      );
  }, []);

  useEffect(() => {
    setHistoryLoading(true);
    api
      .get<{ items: HistoryItem[]; total: number }>("/security/login-history", {
        params: { page: historyPage, page_size: 20 },
      })
      .then((response) => {
        setHistory(response.data.items);
        setHistoryTotal(response.data.total);
      })
      .catch((historyError) =>
        setError(errorMessage(historyError, "Gagal memuat riwayat login.")),
      )
      .finally(() => setHistoryLoading(false));
  }, [historyPage]);

  async function saveSession() {
    try {
      await api.put("/security/settings", {
        sessionTimeoutMinutes: sessionTimeout,
      });
      setMessage("Keamanan sesi berhasil disimpan.");
    } catch (saveError) {
      setError(errorMessage(saveError, "Gagal menyimpan keamanan sesi."));
    }
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await api.put<{ data: Policy }>(
        "/security/policy",
        policy,
      );
      setPolicy(response.data.data);
      setSavedPolicy(response.data.data);
      setMessage("Kebijakan keamanan berhasil disimpan.");
    } catch (saveError) {
      setError(errorMessage(saveError, "Gagal menyimpan kebijakan password."));
    }
  }

  async function startSetup() {
    try {
      const response = await api.post<{ secret: string; otpauthUri: string }>(
        "/security/2fa/setup",
      );
      setSecret(response.data.secret);
      setQr(
        await QRCode.toDataURL(response.data.otpauthUri, {
          width: 220,
          margin: 1,
        }),
      );
      setWizardStep(1);
      setError("");
    } catch (setupError) {
      setError(errorMessage(setupError, "Gagal memulai setup 2FA."));
    }
  }

  async function verifyEnable() {
    try {
      const response = await api.post<{ recoveryCodes: string[] }>(
        "/security/2fa/verify-enable",
        { code },
      );
      setRecoveryCodes(response.data.recoveryCodes);
      setTotpEnabled(true);
      setWizardStep(2);
      setCode("");
    } catch (verifyError) {
      setError(errorMessage(verifyError, "Kode autentikasi tidak valid."));
    }
  }

  function downloadRecoveryCodes() {
    const blob = new Blob([recoveryCodes.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "koperasi-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function disable2fa() {
    try {
      await api.post("/security/2fa/disable", { password, code: disableCode });
      setTotpEnabled(false);
      setDisableOpen(false);
      setPassword("");
      setDisableCode("");
      setMessage("2FA berhasil dinonaktifkan.");
    } catch (disableError) {
      setError(errorMessage(disableError, "Gagal menonaktifkan 2FA."));
    }
  }

  async function regenerateCodes() {
    try {
      const response = await api.post<{ recoveryCodes: string[] }>(
        "/security/2fa/recovery-codes/regenerate",
        { password },
      );
      setRecoveryCodes(response.data.recoveryCodes);
      setWizardStep(2);
      setRegenerateOpen(false);
      setPassword("");
    } catch (regenerateError) {
      setError(errorMessage(regenerateError, "Gagal membuat recovery code."));
    }
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text);
  }

  return (
    <div className="space-y-5">
      {message && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <SettingSection
        title="Autentikasi Dua Faktor"
        description="Tambahkan lapisan verifikasi setelah password untuk melindungi akun."
      >
        <SettingRow
          title="Status 2FA"
          description={
            totpEnabled
              ? "Akun dilindungi autentikasi dua faktor."
              : "Aktifkan aplikasi authenticator untuk keamanan tambahan."
          }
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${totpEnabled ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            {totpEnabled ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" />
            )}
            {totpEnabled ? "Aktif" : "Nonaktif"}
          </span>
        </SettingRow>
        <div className="flex flex-wrap gap-2 pt-4">
          {!totpEnabled ? (
            <button
              type="button"
              onClick={() => void startSetup()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" /> Aktifkan 2FA
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDisableOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"
              >
                <ShieldOff className="h-4 w-4" /> Nonaktifkan
              </button>
              <button
                type="button"
                onClick={() => setRegenerateOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#263449]"
              >
                <KeyRound className="h-4 w-4" /> Buat recovery code baru
              </button>
            </>
          )}
        </div>
      </SettingSection>

      {wizardStep > 0 && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30">
          {wizardStep === 1 ? (
            <>
              <h3 className="font-semibold text-[#102a43] dark:text-slate-100">
                Hubungkan aplikasi authenticator
              </h3>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <img
                  src={qr}
                  alt="QR code setup 2FA"
                  className="h-55 rounded bg-white p-2"
                />
                <div className="min-w-0 text-sm">
                  <p>
                    Pindai QR code atau masukkan secret berikut secara manual:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="break-all rounded bg-white px-2 py-1 text-xs dark:bg-[#111c2e]">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(secret)}
                      aria-label="Salin secret"
                      className="cursor-pointer"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="mt-4 block font-semibold">
                    Kode 6 digit
                    <input
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-[#263449] dark:bg-[#111c2e]"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={code.length !== 6}
                    onClick={() => void verifyEnable()}
                    className="mt-3 cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verifikasi dan aktifkan
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-[#102a43] dark:text-slate-100">
                Simpan recovery code
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Kode hanya ditampilkan sekarang dan tidak dapat dilihat kembali.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white p-3 font-mono text-sm dark:bg-[#111c2e] sm:grid-cols-5">
                {recoveryCodes.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(recoveryCodes.join("\n"))}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-[#263449]"
                >
                  <Copy className="h-4 w-4" /> Salin
                </button>
                <button
                  type="button"
                  onClick={downloadRecoveryCodes}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-[#263449]"
                >
                  <Download className="h-4 w-4" /> Unduh .txt
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    onChange={(event) =>
                      event.target.checked && setWizardStep(0)
                    }
                  />{" "}
                  Saya sudah menyimpannya
                </label>
              </div>
            </>
          )}
        </div>
      )}

      <SettingSection
        title="Keamanan Sesi"
        description="Atur batas waktu sesi karena tidak ada aktivitas."
      >
        <SettingRow
          title="Batas waktu sesi"
          description="Sesi akan berakhir jika tidak ada aktivitas selama durasi ini."
        >
          <select
            value={sessionTimeout}
            onChange={(event) => setSessionTimeout(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100"
          >
            <option value={15}>15 menit</option>
            <option value={30}>30 menit</option>
            <option value={60}>1 jam</option>
            <option value={480}>8 jam</option>
          </select>
        </SettingRow>
        <button
          type="button"
          onClick={() => void saveSession()}
          className="mt-3 cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
        >
          Simpan
        </button>
      </SettingSection>

      <SettingSection
        title="Kebijakan Password"
        description={
          isAdmin
            ? "Aturan ini berlaku untuk password baru."
            : "Kebijakan hanya dapat diubah oleh admin."
        }
      >
        <form onSubmit={savePolicy} className="space-y-1">
          <SettingRow
            title="Panjang minimum"
            description="8 sampai 64 karakter."
          >
            <input
              type="number"
              min={8}
              max={64}
              disabled={!isAdmin}
              value={policy.pwMinLength}
              onChange={(event) =>
                setPolicy({
                  ...policy,
                  pwMinLength: Number(event.target.value),
                })
              }
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100"
            />
          </SettingRow>
          <SettingRow
            title="Huruf dan angka"
            description="Password harus memuat setidaknya satu huruf dan angka."
          >
            <Toggle
              checked={policy.pwRequireLetterNumber}
              disabled={!isAdmin}
              onChange={(checked) =>
                setPolicy({ ...policy, pwRequireLetterNumber: checked })
              }
            />
          </SettingRow>
          <SettingRow
            title="Karakter khusus"
            description="Password harus memuat simbol khusus."
          >
            <Toggle
              checked={policy.pwRequireSpecial}
              disabled={!isAdmin}
              onChange={(checked) =>
                setPolicy({ ...policy, pwRequireSpecial: checked })
              }
            />
          </SettingRow>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-[#1b2a3d] dark:text-slate-300">
            <p className="font-semibold">Pratinjau aturan</p>
            <ul className="mt-1 list-disc pl-5">
              {rulePreview.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          {isAdmin && (
            <button
              type="submit"
              disabled={!policyDirty}
              className="mt-3 cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simpan
            </button>
          )}
        </form>
      </SettingSection>

      <SettingSection
        title="Proteksi Login"
        description={
          isAdmin
            ? "Kunci akun sementara setelah percobaan password gagal berulang."
            : "Aturan ini hanya dapat diubah oleh admin."
        }
      >
        <SettingRow title="Maksimal percobaan gagal">
          <input
            type="number"
            min={3}
            max={10}
            disabled={!isAdmin}
            value={policy.maxFailedAttempts}
            onChange={(event) =>
              setPolicy({
                ...policy,
                maxFailedAttempts: Number(event.target.value),
              })
            }
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100"
          />
        </SettingRow>
        <SettingRow title="Durasi kunci" description="Dalam menit.">
          <input
            type="number"
            min={1}
            max={1440}
            disabled={!isAdmin}
            value={policy.lockoutMinutes}
            onChange={(event) =>
              setPolicy({
                ...policy,
                lockoutMinutes: Number(event.target.value),
              })
            }
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100"
          />
        </SettingRow>
        {isAdmin && (
          <button
            type="button"
            disabled={!policyDirty}
            onClick={() =>
              void savePolicy({ preventDefault: () => undefined } as FormEvent)
            }
            className="mt-3 cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simpan
          </button>
        )}
      </SettingSection>

      <SettingSection
        title="Riwayat Login"
        description="Hanya percobaan login pada akun Anda yang ditampilkan."
      >
        {historyLoading ? (
          <p className="text-sm text-slate-500">Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Belum ada riwayat login.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Perangkat</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 dark:border-[#263449]"
                  >
                    <td className="px-3 py-3">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-3">{item.ip || "-"}</td>
                    <td className="px-3 py-3">{item.deviceLabel || "-"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            Halaman {historyPage} dari {historyPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((page) => page - 1)}
              className="cursor-pointer rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={historyPage >= historyPages}
              onClick={() => setHistoryPage((page) => page + 1)}
              className="cursor-pointer rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </SettingSection>

      <ConfirmDialog
        open={disableOpen}
        title="Nonaktifkan 2FA?"
        description="Masukkan password dan kode authenticator untuk melanjutkan."
        confirmLabel="Nonaktifkan"
        onCancel={() => setDisableOpen(false)}
        onConfirm={() => void disable2fa()}
      >
        <div className="mt-4 space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#1b2a3d]"
          />
          <input
            inputMode="numeric"
            placeholder="Kode 6 digit"
            value={disableCode}
            onChange={(event) => setDisableCode(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#1b2a3d]"
          />
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={regenerateOpen}
        title="Buat recovery code baru?"
        description="Semua recovery code lama akan dibatalkan."
        confirmLabel="Buat baru"
        onCancel={() => setRegenerateOpen(false)}
        onConfirm={() => void regenerateCodes()}
      >
        <input
          type="password"
          placeholder="Password saat ini"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-4 w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#1b2a3d]"
        />
      </ConfirmDialog>
    </div>
  );
}

export default SecuritySettings;
