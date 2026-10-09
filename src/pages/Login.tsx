import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      window.location.assign("/dashboard");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Login gagal"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#102a43]">
      <div className="hidden w-2/5 flex-col justify-between p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#20b2aa] text-sm font-bold text-[#102a43]">KS</div>
            <span className="text-sm font-semibold tracking-wide">Koperasi Sekolah</span>
          </div>
          <div className="mt-32 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5ed5cc]">Ruang administrasi</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Kelola koperasi sekolah dengan lebih terarah.</h1>
            <p className="mt-5 text-sm leading-relaxed text-slate-300">Akses data siswa, barang, tagihan, dan pembayaran dalam satu sistem terintegrasi.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Sistem Informasi Koperasi Sekolah</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[#f5f7fa] px-5 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_12px_36px_rgba(16,42,67,0.08)] sm:p-9">
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b2aa] text-sm font-bold text-[#102a43]">KS</div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#168b87]">Selamat datang</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102a43]">Masuk ke panel</h1>
          <p className="mt-2 mb-7 text-sm text-slate-500">Gunakan akun yang telah diberikan oleh administrator.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@sekolah.sch.id" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-[#20b2aa] focus:ring-2 focus:ring-[#20b2aa]/15" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-slate-900 outline-none transition focus:border-[#20b2aa] focus:ring-2 focus:ring-[#20b2aa]/15" />
                <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#168b87]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#168b87] px-4 py-2.5 font-semibold text-white transition hover:bg-[#13716d] disabled:cursor-not-allowed disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Memproses..." : "Masuk ke aplikasi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;