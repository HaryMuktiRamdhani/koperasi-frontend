import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Camera, Pencil, Trash2, UserRound, X } from "lucide-react";
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

const emptyProfile: ProfileData = {
  id: "",
  name: "",
  username: null,
  email: "",
  phone: null,
  bio: null,
  avatarUrl: null,
  role: "",
};

function getError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    return (
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message || fallback
    );
  }
  return fallback;
}

async function cropSquare(file: File): Promise<string> {
  const source = await createImageBitmap(file);
  const size = Math.min(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  canvas
    .getContext("2d")
    ?.drawImage(
      source,
      (source.width - size) / 2,
      (source.height - size) / 2,
      size,
      size,
      0,
      0,
      600,
      600,
    );
  return canvas.toDataURL(
    file.type === "image/webp" ? "image/webp" : "image/jpeg",
    0.88,
  );
}

function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [draft, setDraft] = useState({ name: "", username: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const response = await api.get<ProfileData>("/profile");
      setProfile(response.data);
      setDraft({
        name: response.data.name,
        username: response.data.username || "",
        bio: response.data.bio || "",
      });
    } catch (loadError) {
      setError(getError(loadError, "Gagal memuat profil."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const username = draft.username.trim().toLowerCase();
    if (!username || username === profile.username) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get<{ available: boolean }>(
          "/profile/check-username",
          { params: { username } },
        );
        setUsernameState(response.data.available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft.username, profile.username]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.username.trim()) {
      setError("Nama lengkap dan username wajib diisi.");
      return;
    }
    if (usernameState === "checking" || usernameState === "taken") {
      setError(
        "Tunggu pengecekan username selesai dan gunakan username yang tersedia.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await api.patch<{ data: ProfileData }>("/profile", {
        name: draft.name.trim(),
        username: draft.username.trim().toLowerCase(),
        email: profile.email,
        phone: profile.phone,
        bio: draft.bio.trim() || null,
        avatarUrl: profile.avatarUrl,
      });
      setProfile(response.data.data);
      setDraft({
        name: response.data.data.name,
        username: response.data.data.username || "",
        bio: response.data.data.bio || "",
      });
      setEditOpen(false);
      setMessage("Profil berhasil disimpan.");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...response.data.data,
        }),
      );
    } catch (saveError) {
      setError(getError(saveError, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Foto harus JPG, PNG, atau WebP dengan ukuran maksimal 5MB.");
      return;
    }
    try {
      setPhotoPreview(await cropSquare(file));
      setPhotoOpen(true);
      setError("");
    } catch {
      setError("Foto tidak dapat diproses.");
    } finally {
      event.target.value = "";
    }
  }

  async function savePhoto() {
    setPhotoSaving(true);
    try {
      const response = await api.patch<{ data: ProfileData }>("/profile", {
        name: profile.name,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        avatarUrl: photoPreview || null,
      });
      setProfile(response.data.data);
      setPhotoOpen(false);
      setPhotoPreview("");
      setMessage("Foto profil berhasil disimpan.");
    } catch (photoError) {
      setError(getError(photoError, "Gagal menyimpan foto profil."));
    } finally {
      setPhotoSaving(false);
    }
  }

  async function deleteAccount() {
    try {
      await api.delete("/profile", {
        data: { username: deleteUsername, password: deletePassword },
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/");
    } catch (deleteError) {
      setError(getError(deleteError, "Gagal menghapus akun."));
      setDeleteOpen(false);
    }
  }

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-[#a7b4c7]">
        Memuat profil...
      </p>
    );
  if (error && !profile.id)
    return <EmptyState title="Profil tidak dapat dimuat" description={error} />;

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${message ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}
        >
          {message || error}
        </p>
      )}
      <section className="rounded-xl border border-slate-200 bg-white p-8 dark:border-[#294254] dark:bg-[#122333]">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[#e7f6f4] text-[#168b87] dark:bg-[#153f45] dark:text-[#72ddd4]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Foto profil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-14 w-14" strokeWidth={1.4} />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Ganti foto profil"
              className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#168b87] text-white dark:border-[#122333]"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void handleAvatar(event)}
              className="hidden"
            />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[#102a43] dark:text-slate-100">
            {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
            @{profile.username || "username belum diatur"}
          </p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {profile.bio || "Belum ada bio"}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft({
                name: profile.name,
                username: profile.username || "",
                bio: profile.bio || "",
              });
              setEditOpen(true);
              setError("");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-[#294254] dark:text-slate-200"
          >
            <Pencil className="h-4 w-4" /> Edit Profil
          </button>
        </div>
      </section>

      <SettingSection
        title="Zona Berbahaya"
        description="Penghapusan akun bersifat permanen dan tidak dapat dibatalkan."
      >
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"
        >
          <Trash2 className="h-4 w-4" /> Hapus Akun
        </button>
      </SettingSection>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 dark:border-[#294254] dark:bg-[#122333]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Profil</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Nama lengkap
                <input
                  required
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[#294254] dark:bg-[#172b3d]"
                />
              </label>
              <label className="block text-sm font-medium">
                Username
                <input
                  required
                  value={draft.username}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      username: event.target.value.toLowerCase(),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[#294254] dark:bg-[#172b3d]"
                />
                {usernameState !== "idle" && (
                  <span
                    className={`mt-1 block text-xs ${usernameState === "available" ? "text-emerald-600" : usernameState === "taken" ? "text-red-600" : "text-slate-500"}`}
                  >
                    {usernameState === "checking"
                      ? "Memeriksa..."
                      : usernameState === "available"
                        ? "Username tersedia"
                        : "Username sudah digunakan"}
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Bio
                <textarea
                  value={draft.bio}
                  onChange={(event) =>
                    setDraft({ ...draft, bio: event.target.value })
                  }
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[#294254] dark:bg-[#172b3d]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#294254]"
                >
                  Batal
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {photoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 dark:border-[#294254] dark:bg-[#122333]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ganti Foto</h2>
              <button
                type="button"
                onClick={() => {
                  setPhotoOpen(false);
                  setPhotoPreview("");
                }}
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-[#a7b4c7]">
              JPG, PNG, atau WebP. Maksimal 5MB.
            </p>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview foto profil"
                className="mx-auto mt-5 h-44 w-44 rounded-full object-cover"
              />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhotoOpen(false);
                  setPhotoPreview("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#294254]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={photoSaving || !photoPreview}
                onClick={() => void savePhoto()}
                className="rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {photoSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus akun secara permanen?"
        description="Ketik username dan password saat ini untuk mengonfirmasi penghapusan akun."
        confirmLabel="Hapus akun"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteAccount()}
      >
        <div className="mt-4 space-y-3">
          <input
            placeholder="Username"
            value={deleteUsername}
            onChange={(event) => setDeleteUsername(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
          />
          <input
            type="password"
            placeholder="Password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

export default ProfileSettings;
