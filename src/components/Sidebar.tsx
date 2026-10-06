import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <aside className="flex min-h-screen w-60 flex-col bg-gray-900 px-4 py-6 text-white">
      <div className="px-2 pb-8">
        <h2 className="text-xl font-bold">Koperasi</h2>
        <span className="text-sm text-gray-400">Sekolah</span>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          to="/dashboard"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Dashboard
        </Link>

        <Link
          to="/jurusan"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Jurusan
        </Link>

        <Link
          to="/classes"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Kelas
        </Link>

        <Link
          to="/students"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Siswa
        </Link>

        <Link
          to="/items"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Barang
        </Link>

        <Link
          to="/bills"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Tagihan
        </Link>

        <Link
          to="/payments"
          className="rounded-lg px-3 py-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
        >
          Pembayaran
        </Link>
      </nav>

      <button
        className="mt-auto rounded-lg bg-gray-800 px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-700 hover:text-white"
        onClick={handleLogout}
      >
        Keluar
      </button>
    </aside>
  );
}

export default Sidebar;