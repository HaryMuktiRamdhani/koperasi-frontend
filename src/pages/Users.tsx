import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, UserCog, UserRound } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserData | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" as "admin" | "staff" });

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get<UserData[]>("/users", { params: { search } });
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

  function resetForm() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "staff" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) await api.put(`/users/${editing.id}`, form);
      else await api.post("/users", form);
      resetForm();
      await loadUsers();
    } catch (caught: unknown) {
      const apiError = caught as ApiError;
      setError(apiError.response?.data?.message || "Pengguna gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: UserData) {
    if (!window.confirm(`${user.isActive ? "Nonaktifkan" : "Aktifkan"} akun ${user.name}?`)) return;
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      await loadUsers();
    } catch (caught: unknown) {
      const apiError = caught as ApiError;
      setError(apiError.response?.data?.message || "Status pengguna gagal diperbarui.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeader title="Manajemen Pengguna" description="Buat dan kelola akun admin atau staff koperasi." icon={UserCog} />
        <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d]"><Plus className="h-4 w-4" /> Pengguna baru</button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="border-b border-slate-100 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa]" /></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Pengguna</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Memuat pengguna...</td></tr> : users.length === 0 ? <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Belum ada pengguna.</td></tr> : users.map((user) => <tr key={user.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-medium text-[#102a43]">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-medium text-[#13716d]">{user.role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}{user.role}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "Aktif" : "Nonaktif"}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => { setEditing(user); setForm({ name: user.name, email: user.email, password: "", role: user.role }); }} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#168b87]" aria-label={`Edit ${user.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => toggleStatus(user)} className="text-xs font-medium text-slate-500 hover:text-[#168b87]">{user.isActive ? "Nonaktifkan" : "Aktifkan"}</button></div></td></tr>)}</tbody></table></div>
        </div>
        <form onSubmit={submit} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]"><h2 className="text-base font-semibold text-[#102a43]">{editing ? "Edit pengguna" : "Tambah pengguna"}</h2><div className="mt-4 space-y-4"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama lengkap" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa]" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa]" /><input required={!editing} minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? "Password baru (opsional)" : "Password minimal 8 karakter"} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa]" /><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "admin" | "staff" })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#20b2aa]"><option value="staff">Staff</option><option value="admin">Admin</option></select></div><div className="mt-5 flex gap-2"><button disabled={saving} type="submit" className="rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Buat pengguna"}</button>{editing && <button type="button" onClick={resetForm} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">Batal</button>}</div></form>
      </div>
    </div>
  );
}

export default UsersPage;
