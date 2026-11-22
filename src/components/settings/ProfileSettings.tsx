import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  AtSign,
  Camera,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import api from "../../services/api";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";

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

const cardClass =
  "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)]";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function getError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    return (
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message || fallback
    );
  }
  return fallback;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatRole(role: string) {
  if (!role) return "-";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function renderBio(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-(--app-primary) underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--app-primary-soft) text-(--app-primary)">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-(--app-muted)">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-(--app-text)">
          {value}
        </p>
      </div>
    </div>
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

  function openEdit() {
    setDraft({
      name: profile.name,
      username: profile.username || "",
      bio: profile.bio || "",
    });
    setEditOpen(true);
    setError("");
  }

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-(--app-muted)">
        Memuat profil...
      </p>
    );
  if (error && !profile.id)
    return <EmptyState title="Profil tidak dapat dimuat" description={error} />;

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-sm ${message ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}
        >
          {message || error}
        </p>
      )}

      {/* Hero: banner + avatar + identitas */}
      <section className={`${cardClass} overflow-hidden`}>
        <div
          className="h-32 sm:h-36"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 38%, var(--app-surface)) 0%, var(--app-surface-muted) 100%)",
          }}
        />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-(--app-surface) bg-(--app-primary-soft) text-3xl font-semibold text-(--app-primary)">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Foto profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(profile.name)
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Ganti foto profil"
                  className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-(--app-surface) bg-(--app-primary) text-white transition hover:opacity-90"
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
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-semibold text-(--app-text)">
                    {profile.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-(--app-primary-soft) px-2.5 py-0.5 text-xs font-semibold text-(--app-primary)">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {formatRole(profile.role)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-(--app-muted)">
                  @{profile.username || "username belum diatur"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openEdit}
              className={`${secondaryButtonClass} sm:mb-1`}
            >
              <Pencil className="h-4 w-4" /> Edit Profil
            </button>
          </div>
        </div>
      </section>

      {/* Detail: tentang + informasi akun */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className={`${cardClass} p-6 lg:col-span-3`}>
          <h3 className="text-base font-semibold text-(--app-text)">Tentang</h3>
          {profile.bio ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-(--app-text)">
              {renderBio(profile.bio)}
            </p>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-(--app-border) px-4 py-8 text-center">
              <p className="text-sm text-(--app-muted)">
                Belum ada bio. Ceritakan sedikit tentang dirimu.
              </p>
              <button
                type="button"
                onClick={openEdit}
                className="mt-3 text-sm font-semibold text-(--app-primary) hover:underline"
              >
                Tambah bio
              </button>
            </div>
          )}
        </section>

        <section className={`${cardClass} px-6 py-4 lg:col-span-2`}>
          <h3 className="pt-2 text-base font-semibold text-(--app-text)">
            Informasi Akun
          </h3>
          <div className="mt-1 divide-y divide-(--app-border)">
            <InfoRow
              icon={<AtSign className="h-4 w-4" />}
              label="Username"
              value={profile.username ? `@${profile.username}` : "-"}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={profile.email || "-"}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Telepon"
              value={profile.phone || "-"}
            />
            <InfoRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Role"
              value={formatRole(profile.role)}
            />
          </div>
        </section>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`${cardClass} w-full max-w-md p-6 shadow-2xl`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-var(--app-text)">
                Edit Profil
              </h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Tutup"
                className="text-(--app-muted) hover:text-(--app-text)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-(--app-text)">
                Nama lengkap
                <input
                  required
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-(--app-text)">
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
                  className={inputClass}
                />
                {usernameState !== "idle" && (
                  <span
                    className={`mt-1 block text-xs ${usernameState === "available" ? "text-emerald-600 dark:text-emerald-400" : usernameState === "taken" ? "text-red-600 dark:text-red-400" : "text-(--app-muted)"}`}
                  >
                    {usernameState === "checking"
                      ? "Memeriksa..."
                      : usernameState === "available"
                        ? "Username tersedia"
                        : "Username sudah digunakan"}
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium text-(--app-text)">
                Bio
                <textarea
                  value={draft.bio}
                  onChange={(event) =>
                    setDraft({ ...draft, bio: event.target.value })
                  }
                  rows={4}
                  className={inputClass}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className={secondaryButtonClass}
                >
                  Batal
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className={primaryButtonClass}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {photoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`${cardClass} w-full max-w-sm p-6 shadow-2xl`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-(--app-text)">
                Ganti Foto
              </h2>
              <button
                type="button"
                onClick={() => {
                  setPhotoOpen(false);
                  setPhotoPreview("");
                }}
                aria-label="Tutup"
                className="text-(--app-muted) hover:text-(--app-text)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-(--app-muted)">
              JPG, PNG, atau WebP. Maksimal 5MB.
            </p>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview foto profil"
                className="mx-auto mt-5 h-44 w-44 rounded-full border-4 border-(--app-border) object-cover"
              />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhotoOpen(false);
                  setPhotoPreview("");
                }}
                className={secondaryButtonClass}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={photoSaving || !photoPreview}
                onClick={() => void savePhoto()}
                className={primaryButtonClass}
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
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            className={inputClass}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

export default ProfileSettings;
