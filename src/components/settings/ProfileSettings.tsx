import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Camera, Eye, EyeOff, KeyRound, Trash2, UserRound } from "lucide-react";
import api from "../../services/api";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import SettingSection from "./SettingSection";

interface ProfileData {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

const emptyProfile: ProfileData = { id: "", name: "", username: null, email: "", phone: null, bio: null, avatarUrl: null, role: "" };

function getError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

async function cropSquare(file: File): Promise<string> {
  const source = await createImageBitmap(file);
  const size = Math.min(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  canvas.getContext("2d")?.drawImage(source, (source.width - size) / 2, (source.height - size) / 2, size, size, 0, 0, 600, 600);
  return canvas.toDataURL(file.type === "image/webp" ? "image/webp" : "image/jpeg", 0.88);
}

function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [draft, setDraft] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(profile) !== JSON.stringify(draft);
  const passwordStrength = useMemo(() => {
    const value = passwords.newPassword;
    if (!value) return { label: "", className: "" };
    const score = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
    return score >= 4 ? { label: "Kuat", className: "text-emerald-600 dark:text-emerald-300" } : score >= 2 ? { label: "Sedang", className: "text-amber-600 dark:text-amber-300" } : { label: "Lemah", className: "text-red-600 dark:text-red-300" };
  }, [passwords.newPassword]);

  async function load() {
    try {
      const profileResponse = await api.get<ProfileData>("/profile");
      setProfile(profileResponse.data);
      setDraft(profileResponse.data);
    } catch (loadError) {
      setError(getError(loadError, "Gagal memuat profil."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const username = draft.username?.trim().toLowerCase() || "";
    if (!username || username === profile.username) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get<{ available: boolean }>("/profile/check-username", { params: { username } });
        setUsernameState(response.data.available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft.username, profile.username]);

  function updateDraft(field: keyof ProfileData, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!dirty) return;
    if (usernameState === "checking" || usernameState === "taken") {
      setError("Tunggu pengecekan username selesai dan gunakan username yang tersedia.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch<{ data: ProfileData }>("/profile", {
        name: draft.name,
        username: draft.username,
        email: draft.email,
        phone: draft.phone || null,
        bio: draft.bio || null,
        avatarUrl: draft.avatarUrl || null,
      });
      setProfile(response.data.data);
      setDraft(response.data.data);
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...response.data.data }));
      setMessage("Profil berhasil disimpan.");
    } catch (saveError) {
      setError(getError(saveError, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Foto harus JPG, PNG, atau WebP dengan ukuran maksimal 5MB.");
      return;
    }
    setAvatarLoading(true);
    try {
      updateDraft("avatarUrl", await cropSquare(file));
    } catch {
      setError("Foto tidak dapat diproses.");
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      return;
    }
    try {
      const response = await api.patch<{ message: string }>("/profile/password", passwords);
      setPasswordMessage(response.data.message);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (passwordError) {
      setPasswordError(getError(passwordError, "Gagal mengubah password."));
    }
  }

  async function deleteAccount() {
    try {
      await api.delete("/profile", { data: { username: deleteUsername, password: deletePassword } });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/");
    } catch (deleteError) {
      setError(getError(deleteError, "Gagal menghapus akun."));
      setDeleteOpen(false);
    }
  }

  if (loading) return <p className="py-12 text-center text-sm text-slate-500 dark:text-[#a7b4c7]">Memuat profil...</p>;
  if (error && !profile.id) return <EmptyState title="Profil tidak dapat dimuat" description={error} />;

  return (
    <div className="space-y-5">
      {(message || error) && <p className={`rounded-lg px-3 py-2 text-sm ${message ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>{message || error}</p>}
      <SettingSection title="Informasi Profil" description="Perubahan disimpan ke akun Anda setelah validasi berhasil.">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5 dark:border-[#263449]">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#20b2aa] text-3xl font-semibold text-[#102a43] dark:bg-[#2dd4bf] dark:text-[#0f172a]">
              {draft.avatarUrl ? <img src={draft.avatarUrl} alt="Foto profil" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12" />}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarLoading} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-[#263449]">{avatarLoading ? "Memproses..." : <><Camera className="h-4 w-4" /> Ganti foto</>}</button>
              {draft.avatarUrl && <button type="button" onClick={() => updateDraft("avatarUrl", "")} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-300">Hapus foto</button>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
            </div>
            <p className="text-xs text-slate-500 dark:text-[#a7b4c7]">JPG, PNG, atau WebP. Maksimal 5MB. Foto akan dipotong persegi.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">Nama lengkap<input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" required /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">Username<input value={draft.username || ""} onChange={(event) => updateDraft("username", event.target.value.toLowerCase())} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" required />{usernameState !== "idle" && <span className={`mt-1 block text-xs ${usernameState === "available" ? "text-emerald-600" : usernameState === "taken" ? "text-red-600" : "text-slate-500"}`}>{usernameState === "checking" ? "Memeriksa..." : usernameState === "available" ? "Username tersedia" : "Username sudah digunakan"}</span>}</label>
            <label className="text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">Email<input type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" required /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">Nomor HP<input value={draft.phone || ""} onChange={(event) => updateDraft("phone", event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" /></label>
          </div>
          <label className="block text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">Bio<textarea value={draft.bio || ""} maxLength={500} onChange={(event) => updateDraft("bio", event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" /></label>
          <div className="flex items-center justify-between"><span className="text-sm text-slate-500 dark:text-[#a7b4c7]">Role: <strong>{profile.role}</strong></span><button type="submit" disabled={!dirty || saving} className="cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13716d] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan profil"}</button></div>
        </form>
      </SettingSection>

      <SettingSection title="Ganti Password" description="Password disimpan menggunakan hash bcrypt dan tidak pernah ditampilkan atau disimpan sebagai teks biasa.">
        <form onSubmit={changePassword} className="space-y-4">
          {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{passwordError}</p>}
          {passwordMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{passwordMessage}</p>}
          {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => <label key={field} className="block text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">{field === "currentPassword" ? "Password lama" : field === "newPassword" ? "Password baru" : "Konfirmasi password"}<div className="relative"><input type={showPasswords ? "text" : "password"} value={passwords[field]} onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" required />{field === "currentPassword" && <button type="button" onClick={() => setShowPasswords((value) => !value)} className="absolute right-3 top-3 cursor-pointer text-slate-400">{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}</div>{field === "newPassword" && <span className={`mt-1 block text-xs ${passwordStrength.className}`}>{passwordStrength.label || "Minimal 8 karakter"}</span>}</label>)}
          <button type="submit" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13716d]"><KeyRound className="h-4 w-4" /> Simpan password</button>
        </form>
      </SettingSection>

      <SettingSection title="Hapus Akun" description="Tindakan ini permanen dan memerlukan konfirmasi username serta password.">
        <button type="button" onClick={() => setDeleteOpen(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"><Trash2 className="h-4 w-4" /> Hapus akun</button>
      </SettingSection>
      <ConfirmDialog open={deleteOpen} title="Hapus akun secara permanen?" description="Ketik username dan password saat ini untuk mengonfirmasi penghapusan akun." confirmLabel="Hapus akun" onCancel={() => setDeleteOpen(false)} onConfirm={() => void deleteAccount()}><div className="mt-4 space-y-3"><input placeholder="Username" value={deleteUsername} onChange={(event) => setDeleteUsername(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d]" /><input type="password" placeholder="Password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#263449] dark:bg-[#1b2a3d]" /></div></ConfirmDialog>
    </div>
  );
}

export default ProfileSettings;
