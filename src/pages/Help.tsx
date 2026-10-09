import { CircleHelp, Search, Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";

function Help() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Help & Support" description="Panduan singkat untuk menggunakan panel koperasi." icon={CircleHelp} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Search, title: "Pencarian", text: "Gunakan search bar untuk mencari menu atau data yang tersedia." },
          { icon: Wallet, title: "Pembayaran", text: "Pembayaran hanya dapat diproses untuk tagihan yang belum lunas." },
          { icon: CircleHelp, title: "Akses akun", text: "Hubungi admin jika akun staff perlu dibuat atau diaktifkan." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
            <item.icon className="h-5 w-5 text-[#168b87]" />
            <h2 className="mt-4 text-sm font-semibold text-[#102a43]">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Help;
