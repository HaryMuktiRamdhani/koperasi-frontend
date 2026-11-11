import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import api from "../../services/api";
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

function SecuritySettings() {
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [savedPolicy, setSavedPolicy] = useState<Policy>(defaultPolicy);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await api.patch<{ message: string }>(
        "/profile/password",
        passwords,
      );
      setMessage(response.data.message);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordOpen(false);
    } catch (passwordError) {
      setError(errorMessage(passwordError, "Gagal mengubah password."));
    } finally {
      setPasswordSaving(false);
    }
  }

  const policyDirty = JSON.stringify(policy) !== JSON.stringify(savedPolicy);
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
        setSessionTimeout(settings.data.sessionTimeoutMinutes);
        setPolicy(policyResponse.data);
        setSavedPolicy(policyResponse.data);
      })
      .catch((loadError) =>
        setError(errorMessage(loadError, "Gagal memuat pengaturan keamanan.")),
      );
  }, []);

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
        title="Ganti Password"
        description="Perbarui password akun secara berkala untuk menjaga keamanan."
      >
        <button
          type="button"
          onClick={() => {
            setPasswordOpen(true);
            setError("");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
        >
          <KeyRound className="h-4 w-4" /> Ubah Password
        </button>
      </SettingSection>

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

      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 dark:border-[#294254] dark:bg-[#122333]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
          >
            <div className="flex items-center justify-between">
              <h2 id="password-title" className="text-lg font-semibold">
                Ubah Password
              </h2>
              <button
                type="button"
                onClick={() => setPasswordOpen(false)}
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={changePassword} className="mt-5 space-y-4">
              {(
                ["currentPassword", "newPassword", "confirmPassword"] as const
              ).map((field) => (
                <label key={field} className="block text-sm font-medium">
                  {field === "currentPassword"
                    ? "Password lama"
                    : field === "newPassword"
                      ? "Password baru"
                      : "Konfirmasi password"}
                  <div className="relative">
                    <input
                      required
                      type={visiblePasswords[field] ? "text" : "password"}
                      value={passwords[field]}
                      onChange={(event) =>
                        setPasswords({
                          ...passwords,
                          [field]: event.target.value,
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 dark:border-[#294254] dark:bg-[#172b3d]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVisiblePasswords({
                          ...visiblePasswords,
                          [field]: !visiblePasswords[field],
                        })
                      }
                      className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 text-slate-500"
                      aria-label={
                        visiblePasswords[field]
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {visiblePasswords[field] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>
              ))}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#294254]"
                >
                  Batal
                </button>
                <button
                  disabled={passwordSaving}
                  type="submit"
                  className="rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {passwordSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecuritySettings;
