import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Koperasi</h2>
        <span>Sekolah</span>
      </div>

      <nav>
        <Link to="/dashboard">Dashboard</Link>

        <Link to="/jurusan">Jurusan</Link>

        <Link to="/classes">Kelas</Link>

        <Link to="/students">Siswa</Link>

        <Link to="/items">Barang</Link>

        <Link to="/bills">Tagihan</Link>

        <Link to="/payments">Pembayaran</Link>
      </nav>

      <button className="logout-button" onClick={handleLogout}>
        Keluar
      </button>
    </aside>
  );
}

export default Sidebar;
