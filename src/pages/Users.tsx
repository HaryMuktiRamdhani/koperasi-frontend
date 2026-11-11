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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeader
          title="Manajemen Pengguna"
          description="Buat dan kelola akun admin atau staff koperasi."
          icon={UserCog}
        />
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d]"
        >
          <Plus className="h-4 w-4" /> Pengguna baru
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#263449] dark:bg-[#111c2e]">
        <div className="border-b border-slate-100 p-4 dark:border-[#263449]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#172b3d]"
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
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Memuat pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Belum ada pengguna.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#172b3d]"
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-medium text-[#13716d] dark:bg-[#153f45] dark:text-[#72ddd4]">
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
                        className="rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-xs font-medium dark:border-[#294254]"
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                          aria-label={`Lihat ${user.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#294254] dark:bg-[#122333]"
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
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172b3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {step === 1 && !editing ? (
              <form onSubmit={nextStep} className="mt-5 space-y-4">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Lanjut
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Nama lengkap"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Password baru (opsional)"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-[#294254] dark:bg-[#172b3d]"
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-[#294254]"
                  >
                    Kembali
                  </button>
                  <button
                    disabled={saving}
                    type="submit"
                    className="flex-1 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#294254] dark:bg-[#122333]"
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
                className="p-1 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Nama lengkap</dt>
                <dd className="font-medium">{detailUser.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Username</dt>
                <dd className="font-medium">
                  {detailUser.username || "Belum diatur"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium">{detailUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Role</dt>
                <dd className="font-medium">{detailUser.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="font-medium">
                  {detailUser.isActive ? "Aktif" : "Nonaktif"}
                </dd>
              </div>
              <div>
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
                      className="text-slate-500"
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
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
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
