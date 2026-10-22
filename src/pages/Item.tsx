import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

interface BarangData {
  id: string;
  name: string;
  price: number;
  status?: "Aktif" | "Nonaktif" | "Akan Datang";
}

function Item() {
  const [barang, setBarang] = useState<BarangData[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] =
    useState<NonNullable<BarangData["status"]>>("Aktif");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function getBarang() {
    try {
      const response = await api.get("/items");
      setBarang(response.data);
    } catch (error) {
      console.error("Gagal mengambil data barang", error);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name || !price) {
      alert("Nama dan harga barang wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const data = {
        name,
        price: Number(price),
        status,
      };

      if (editId) {
        await api.put(`/items/${editId}`, data);
      } else {
        await api.post("/items", data);
      }

      resetForm();
      await getBarang();
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.message || "Gagal menyimpan data barang");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: BarangData) {
    setEditId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setStatus(item.status || "Aktif");
  }

  function resetForm() {
    setEditId(null);
    setName("");
    setPrice("");
    setStatus("Aktif");
  }

  async function handleDelete() {
    if (!deleteId || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.delete(`/items/${deleteId}`);
      setDeleteId(null);
      await getBarang();
    } catch (error: any) {
      console.error(error);
      setDeleteError(error.response?.data?.message || "Gagal menghapus barang");
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    getBarang();
  }, []);

  return (
    <div>
      <PageHeader
        title="Barang"
        description="Kelola data barang koperasi"
        icon={Package}
      />

      <div className="mb-6 rounded-xl bg-white dark:bg-[#111c2e] p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-slate-100">
          {editId ? "Edit Barang" : "Tambah Barang"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Nama barang"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <label className="text-sm font-medium text-gray-700 dark:text-[#a7b4c7]">
              Status Barang
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as NonNullable<BarangData["status"]>,
                  )
                }
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2.5 font-normal text-gray-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Akan Datang">Akan Datang</option>
              </select>
            </label>

            <input
              type="number"
              placeholder="Harga"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : editId
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-5 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="border-b border-gray-200 dark:border-[#263449] px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Daftar Barang</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
              {barang.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#1b2a3d]">
                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">{index + 1}</td>

                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    Rp {item.price.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Aktif"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          : item.status === "Akan Datang"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-gray-100 dark:bg-[#1b2a3d] text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {item.status || "Aktif"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setDeleteId(item.id);
                          setDeleteError("");
                        }}
                        className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {barang.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500 dark:text-[#a7b4c7]"
                  >
                    Belum ada data barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Hapus Barang?"
        description="Data barang yang dipilih akan dihapus. Tindakan ini tidak dapat dibatalkan."
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => {
          if (!deleteLoading) setDeleteId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default Item;
