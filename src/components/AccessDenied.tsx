import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-[#263449] dark:bg-[#111c2e]">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold text-[#102a43] dark:text-slate-100">
          Akses Ditolak
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#a7b4c7]">
          Kamu tidak memiliki izin untuk mengakses fitur ini. Hubungi
          administrator jika membutuhkan akses.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-6 cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}

export default AccessDenied;
