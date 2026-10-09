import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface ProfileData {
  name: string;
  email: string;
  role: string;
}

function Profile() {
  const [profile, setProfile] = useState<ProfileData>({ name: "", email: "", role: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<ProfileData>("/profile").then((response) => setProfile(response.data)).catch(() => setError("Profil gagal dimuat."));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.patch<{ data: ProfileData }>("/profile", {
        name: profile.name,
        email: profile.email,
      });
      setProfile(response.data.data);
      localStorage.setItem("user", JSON.stringify(response.data.data));
      setMessage("Profil berhasil diperbarui.");
    } catch {
      setError("Profil gagal diperbarui. Periksa nama dan email.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Kelola informasi dasar akun Anda." icon={UserRound} />
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
        {message && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Nama
            <input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#20b2aa] focus:ring-2 focus:ring-[#20b2aa]/15" />
          </label>
          <label className="text-sm font-medium text-slate-700">Email
            <input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#20b2aa] focus:ring-2 focus:ring-[#20b2aa]/15" />
          </label>
        </div>
        <p className="mt-4 text-sm text-slate-500">Role akun: <span className="font-semibold text-[#102a43]">{profile.role || "Memuat..."}</span>. Role tidak dapat diubah dari profil.</p>
        <button type="submit" className="mt-6 rounded-lg bg-[#168b87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#13716d]">Simpan perubahan</button>
      </form>
    </div>
  );
}

export default Profile;
