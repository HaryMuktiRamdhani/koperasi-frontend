import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface BarangData {
  id: string;
  name: string;
  price: number;
  status: string;
}

function Item() {
  const [barang, setBarang] = useState<BarangData[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
  }

  function resetForm() {
    setEditId(null);
    setName("");
    setPrice("");
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Yakin ingin menghapus barang ini?");

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/items/${id}`);
      await getBarang();
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.message || "Gagal menghapus barang");
    }
  }

  useEffect(() => {
    getBarang();
  }, []);

  return (
    <div>
      <PageHeader title="Barang" description="Kelola data barang koperasi" icon={Package} />

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editId ? "Edit Barang" : "Tambah Barang"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nama barang"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="number"
              placeholder="Harga"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="rounded-lg bg-gray-100 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {barang.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{index + 1}</td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    Rp {item.price.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {item.status}
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
                        onClick={() => handleDelete(item.id)}
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
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada data barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Item;
