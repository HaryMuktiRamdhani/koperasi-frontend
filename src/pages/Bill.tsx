import { useEffect, useState } from "react";
import api from "../services/api";

interface TagihanData {
  id: string;
  studentId: string;
  itemId: string;
  amount: number;
  status: string;
  Student?: {
    id: string;
    nis: string;
    name: string;
  };
  Item?: {
    id: string;
    name: string;
    price: number;
  };
}

interface SiswaData {
  id: string;
  nis: string;
  name: string;
}

interface BarangData {
  id: string;
  name: string;
  price: number;
}

function Bill() {
  const [tagihan, setTagihan] = useState<TagihanData[]>([]);
  const [siswa, setSiswa] = useState<SiswaData[]>([]);
  const [barang, setBarang] = useState<BarangData[]>([]);

  const [studentId, setStudentId] = useState("");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function getTagihan() {
    try {
      const response = await api.get("/bills");
      setTagihan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data tagihan", error);
    }
  }

  async function getSiswa() {
    try {
      const response = await api.get("/students");
      setSiswa(response.data);
    } catch (error) {
      console.error("Gagal mengambil data siswa", error);
    }
  }

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

    if (!studentId || !itemId || !amount) {
      alert("Data tagihan belum lengkap");
      return;
    }

    setLoading(true);

    try {
      const data = {
        studentId,
        itemId,
        amount: Number(amount),
      };

      if (editId) {
        await api.put(`/bills/${editId}`, data);
      } else {
        await api.post("/bills", data);
      }

      resetForm();
      await getTagihan();
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Gagal menyimpan tagihan"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: TagihanData) {
    setEditId(item.id);
    setStudentId(item.studentId);
    setItemId(item.itemId);
    setAmount(String(item.amount));
  }

  function resetForm() {
    setEditId(null);
    setStudentId("");
    setItemId("");
    setAmount("");
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus tagihan ini?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/bills/${id}`);
      await getTagihan();
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Gagal menghapus tagihan"
      );
    }
  }

  useEffect(() => {
    getTagihan();
    getSiswa();
    getBarang();
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Tagihan
        </h1>

        <p className="mt-1 text-gray-500">
          Kelola tagihan siswa
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editId ? "Edit Tagihan" : "Tambah Tagihan"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <select
              value={studentId}
              onChange={(event) =>
                setStudentId(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Pilih siswa</option>

              {siswa.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nis} - {item.name}
                </option>
              ))}
            </select>

            <select
              value={itemId}
              onChange={(event) =>
                setItemId(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Pilih barang</option>

              {barang.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              placeholder="Nominal tagihan"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
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
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Tagihan
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {tagihan.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {item.Student?.name || "-"}
                    </div>

                    <div className="text-xs text-gray-500">
                      {item.Student?.nis || "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.Item?.name || "-"}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    Rp {item.amount.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={
                        item.status === "Lunas"
                          ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                          : "rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
                      }
                    >
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
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {tagihan.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada data tagihan.
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

export default Bill;