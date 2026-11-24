import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  ShieldCheck,
  UserCog,
  UserRound,
  X,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface UserData {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: "admin" | "staff";
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

type FormStep = 1 | 2;

/*
  Semua animasi ada di sini supaya file ini tetap single-file.
  Daftar animasi:
  1.  Fade Up          -> .um-fade-up
  2.  Fade In          -> .um-fade-in
  3.  Stagger          -> variabel --um-delay (dipakai di header, tabel, dll)
  4.  Row Fade In      -> .um-row-in
  5.  Card Hover       -> .um-card
  6.  Row Hover        -> .um-row
  7.  Button Hover     -> .um-btn
  8.  Button Press     -> .um-btn:active (scale)
  9.  Input Focus      -> .um-input
  10. Badge Hover      -> .um-badge
  11. Loading Spinner  -> .um-spinner
  12. Reduced Motion   -> @media (prefers-reduced-motion: reduce)
  Tambahan: Alert Slide Down (.um-alert), Modal Backdrop (.um-backdrop),
  Modal Pop (.um-modal), Step Slide (.um-step), Detail Item Stagger.
*/
const ANIMATION_CSS = `
.um-root {
  --um-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* 1. Fade Up */
@keyframes um-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-fade-up {
  animation: um-fade-up 0.5s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 2. Fade In */
@keyframes um-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-fade-in {
  animation: um-fade-in 0.4s ease-out backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 4. Row Fade In (dipakai bersama stagger lewat --um-delay) */
@keyframes um-row-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-row-in {
  animation: um-row-in 0.4s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* Alert / notice slide down */
@keyframes um-alert {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-alert {
  animation: um-alert 0.3s var(--um-ease) backwards;
}

/* Modal backdrop + pop */
@keyframes um-backdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-backdrop {
  animation: um-backdrop 0.2s ease-out backwards;
}
@keyframes um-modal {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.um-modal {
  animation: um-modal 0.3s var(--um-ease) backwards;
}

/* Step form slide */
@keyframes um-step {
  from { opacity: 0; transform: translateX(14px); }
  to { opacity: 1; transform: translateX(0); }
}
.um-step {
  animation: um-step 0.3s var(--um-ease) backwards;
}

/* 5. Card Hover */
.um-card {
  transition: transform 0.25s var(--um-ease), box-shadow 0.25s var(--um-ease),
    border-color 0.25s ease;
}
@media (hover: hover) {
  .um-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -12px rgba(15, 23, 42, 0.25);
    border-color: rgba(32, 178, 170, 0.45);
  }
}

/* 6. Row Hover */
.um-row {
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
@media (hover: hover) {
  .um-row:hover {
    box-shadow: inset 3px 0 0 #20b2aa;
  }
}

/* 7. Button Hover + 8. Button Press */
.um-btn {
  transition: transform 0.18s var(--um-ease), background-color 0.18s ease,
    box-shadow 0.18s ease, opacity 0.18s ease;
}
@media (hover: hover) {
  .um-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -6px rgba(22, 139, 135, 0.55);
  }
}
.um-btn:not(:disabled):active {
  transform: scale(0.95);
  box-shadow: none;
}
.um-btn:focus-visible {
  outline: 2px solid #20b2aa;
  outline-offset: 2px;
}

/* 9. Input Focus */
.um-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    background-color 0.2s ease;
}
.um-input:focus {
  border-color: #20b2aa;
  box-shadow: 0 0 0 3px rgba(32, 178, 170, 0.22);
}

/* 10. Badge Hover */
.um-badge {
  transition: transform 0.2s var(--um-ease), box-shadow 0.2s ease;
}
@media (hover: hover) {
  .um-badge:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 10px -4px rgba(22, 139, 135, 0.5);
  }
}

/* 11. Loading Spinner */
@keyframes um-spin {
  to { transform: rotate(360deg); }
}
.um-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: um-spin 0.7s linear infinite;
}

/* Pulse titik loading di tabel */
@keyframes um-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
.um-pulse {
  animation: um-pulse 1.4s ease-in-out infinite;
}

/* 12. Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .um-root *,
  .um-root *::before,
  .um-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  .um-card:hover,
  .um-btn:hover,
  .um-btn:active,
  .um-badge:hover {
    transform: none !important;
  }
  .um-spinner {
    animation: none !important;
    border-right-color: currentColor;
    opacity: 0.6;
  }
}
`;

/* Stagger helper: delay naik per index, dibatasi supaya tidak kelamaan */
function stagger(index: number, base = 0, step = 45, max = 12) {
  return { "--um-delay": `${base + Math.min(index, max) * step}ms` } as React.CSSProperties;
}

function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<UserData | null>(null);
  const [detailUser, setDetailUser] = useState<UserData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState<FormStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [detailPassword, setDetailPassword] = useState<string | null>(null);
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "staff" as "admin" | "staff",
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get<UserData[]>("/users", {
        params: { search },
      });
      setUsers(response.data);
    } catch {
      setError("Data pengguna gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  function closeForm() {
    setCreateOpen(false);
    setEditing(null);
    setStep(1);
    setShowPassword(false);
    setForm({ name: "", username: "", email: "", password: "", role: "staff" });
  }

  function openCreate() {
    setError("");
    setNotice("");
    setEditing(null);
    setStep(1);
    setCreateOpen(true);
  }

  function openEdit(user: UserData) {
    setError("");
    setNotice("");
    setEditing(user);
    setStep(2);
    setCreateOpen(true);
    setForm({
      name: user.name,
      username: user.username || "",
      email: user.email,
      password: "",
      role: user.role,
    });
  }

  function nextStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.email || !form.password || !form.role) {
      setError("Email, password, dan role wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (form.password.length < 8) {
      setError(
        "Password minimal 8 karakter dan harus mengikuti kebijakan keamanan.",
      );
      return;
    }
    setError("");
    setStep(2);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.username.trim()) {
      setError("Nama lengkap dan username wajib diisi.");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(form.username.trim().toLowerCase())) {
      setError(
        "Username harus 3-30 karakter: huruf kecil, angka, atau garis bawah.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setNotice("Pengguna berhasil diperbarui.");
      } else {
        const response = await api.post<{ data: UserData }>("/users", {
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setDetailUser({ ...response.data.data, username: form.username });
        setDetailPassword(form.password);
        setNotice("Akun berhasil dibuat.");
      }
      closeForm();
      await loadUsers();
    } catch (caught: unknown) {
      const apiError = caught as ApiError;
      setError(apiError.response?.data?.message || "Pengguna gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: UserData, nextValue: boolean) {
    if (
      user.isActive &&
      !nextValue &&
      !window.confirm(`Nonaktifkan akun ${user.name}?`)
    ) {
      return;
    }
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: nextValue });
      setNotice("Status pengguna berhasil diperbarui.");
      await loadUsers();
    } catch (caught: unknown) {
      const apiError = caught as ApiError;
      setError(
        apiError.response?.data?.message || "Status pengguna gagal diperbarui.",
      );
    }
  }

  // Spinner penuh hanya saat pertama kali memuat, supaya baris tidak
  // hilang-muncul (dan animasinya ulang) setiap kali mengetik di pencarian.
  const initialLoading = loading && users.length === 0;

  return (
    <div className="um-root space-y-6">
      <style>{ANIMATION_CSS}</style>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="um-fade-up" style={stagger(0)}>
          <PageHeader
            title="Manajemen Pengguna"
            description="Buat dan kelola akun admin atau staff koperasi."
            icon={UserCog}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={stagger(1, 0, 80)}
          className="um-btn um-fade-up inline-flex items-center justify-center gap-2 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d]"
        >
          <Plus className="h-4 w-4" /> Pengguna baru
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="um-alert rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="um-alert rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}

      <div
        style={stagger(2, 0, 80)}
        className="um-card um-fade-up overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#263449] dark:bg-[#111c2e]"
      >
        <div className="border-b border-slate-100 p-4 dark:border-[#263449]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau email..."
            className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#172b3d]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-[#172b3d] dark:text-[#a7b4c7]">
              <tr>
                <th className="px-5 py-3">Pengguna</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#263449]">
              {initialLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    <span className="um-fade-in inline-flex items-center gap-2">
                      <span className="um-spinner text-[#20b2aa]" aria-hidden="true" />
                      <span className="um-pulse">Memuat pengguna...</span>
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    <span className="um-fade-in inline-block">
                      Belum ada pengguna.
                    </span>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    style={stagger(index, 120)}
                    className={`um-row um-row-in hover:bg-slate-50 dark:hover:bg-[#172b3d] ${
                      loading ? "opacity-70" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#102a43] dark:text-slate-100">
                        {user.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">
                        {user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="um-badge inline-flex items-center gap-1 rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-medium text-[#13716d] dark:bg-[#153f45] dark:text-[#72ddd4]">
                        {user.role === "admin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserRound className="h-3.5 w-3.5" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.isActive ? "active" : "inactive"}
                        onChange={(event) =>
                          void toggleStatus(
                            user,
                            event.target.value === "active",
                          )
                        }
                        className="um-input rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-xs font-medium outline-none dark:border-[#294254]"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailUser(user);
                            setDetailPassword(null);
                            setShowDetailPassword(false);
                          }}
                          className="um-btn inline-flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/50"
                          aria-label={`Lihat ${user.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="um-btn inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          aria-label={`Edit ${user.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div
          className="um-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
        >
          <div
            className="um-modal w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#294254] dark:bg-[#122333]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="user-modal-title"
                  className="text-lg font-semibold text-[#102a43] dark:text-slate-100"
                >
                  {editing ? "Edit pengguna" : "Pengguna baru"}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">
                  {editing
                    ? "Perbarui informasi akun."
                    : `Langkah ${step} dari 2`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Tutup"
                className="um-btn rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172b3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {step === 1 && !editing ? (
              <form
                key="step-1"
                onSubmit={nextStep}
                className="um-step mt-5 space-y-4"
              >
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Email"
                  className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                />
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    placeholder="Password"
                    className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="um-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as "admin" | "staff",
                    })
                  }
                  className="um-input w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="um-btn w-full rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d]"
                >
                  Lanjut
                </button>
              </form>
            ) : (
              <form
                key="step-2"
                onSubmit={submit}
                className="um-step mt-5 space-y-4"
              >
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Nama lengkap"
                  className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                />
                <input
                  required
                  value={form.username}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      username: event.target.value.toLowerCase(),
                    })
                  }
                  placeholder="Username"
                  className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                />
                {editing && (
                  <>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      placeholder="Email"
                      className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Password baru (opsional)"
                      className="um-input w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none dark:border-[#294254] dark:bg-[#172b3d]"
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="um-btn flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-[#294254] dark:hover:bg-[#172b3d]"
                  >
                    Kembali
                  </button>
                  <button
                    disabled={saving}
                    type="submit"
                    className="um-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d] disabled:opacity-60"
                  >
                    {saving && (
                      <span className="um-spinner" aria-hidden="true" />
                    )}
                    {saving
                      ? "Menyimpan..."
                      : editing
                        ? "Simpan perubahan"
                        : "Buat Akun"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {detailUser && (
        <div
          className="um-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
        >
          <div
            className="um-modal w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#294254] dark:bg-[#122333]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <div className="flex items-center justify-between">
              <h2
                id="detail-title"
                className="text-lg font-semibold text-[#102a43] dark:text-slate-100"
              >
                Detail akun
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDetailUser(null);
                  setDetailPassword(null);
                  setShowDetailPassword(false);
                }}
                aria-label="Tutup"
                className="um-btn rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172b3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="um-fade-up" style={stagger(0, 80, 50)}>
                <dt className="text-xs text-slate-500">Nama lengkap</dt>
                <dd className="font-medium">{detailUser.name}</dd>
              </div>
              <div className="um-fade-up" style={stagger(1, 80, 50)}>
                <dt className="text-xs text-slate-500">Username</dt>
                <dd className="font-medium">
                  {detailUser.username || "Belum diatur"}
                </dd>
              </div>
              <div className="um-fade-up" style={stagger(2, 80, 50)}>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium">{detailUser.email}</dd>
              </div>
              <div className="um-fade-up" style={stagger(3, 80, 50)}>
                <dt className="text-xs text-slate-500">Role</dt>
                <dd className="font-medium">{detailUser.role}</dd>
              </div>
              <div className="um-fade-up" style={stagger(4, 80, 50)}>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="font-medium">
                  {detailUser.isActive ? "Aktif" : "Nonaktif"}
                </dd>
              </div>
              <div className="um-fade-up" style={stagger(5, 80, 50)}>
                <dt className="text-xs text-slate-500">Password</dt>
                <dd className="flex items-center gap-2 font-medium">
                  {detailPassword
                    ? showDetailPassword
                      ? detailPassword
                      : "••••••••"
                    : "Tidak dapat dilihat. Reset password jika lupa."}
                  {detailPassword && (
                    <button
                      type="button"
                      onClick={() => setShowDetailPassword(!showDetailPassword)}
                      aria-label={
                        showDetailPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="um-btn text-slate-500"
                    >
                      {showDetailPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </dd>
              </div>
            </dl>
            <div
              className="um-fade-in mt-5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"
              style={{ "--um-delay": "420ms" } as React.CSSProperties}
            >
              <Check className="h-4 w-4" /> Password tidak disimpan sebagai
              plaintext.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;