import { useEffect, useState } from "react";
import api from "../services/api";

interface TagihanData {
  id: string;
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

interface PembayaranData {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string | null;
  Bill?: {
    id: string;
    studentId: string;
    itemId: string;
    amount: number;
    status: string;
  };
  User?: {
    id: string;
    name: string;
    email: string;
  };
}

function Payment() {
  const [tagihan, setTagihan] = useState<TagihanData[]>([]);
  const [pembayaran, setPembayaran] = useState<PembayaranData[]>([]);

  const [billId, setBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  async function getTagihan() {
    try {
      const response = await api.get("/bills");
      setTagihan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data tagihan", error);
    }
  }

  async function getPembayaran() {
    try {
      const response = await api.get("/payments");
      setPembayaran(response.data);
    } catch (error) {
      console.error("Gagal mengambil data pembayaran", error);
    }
  }

  function handleBillChange(value: string) {
    setBillId(value);

    const selectedBill = tagihan.find(
      (item) => item.id === value
    );

    if (selectedBill) {
      setAmount(String(selectedBill.amount));
    } else {
      setAmount("");
    }
  }

  function resetForm() {
    setBillId("");
    setAmount("");
    setPaymentMethod("");
    setPaymentDate("");
    setNotes("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (
      !billId ||
      !amount ||
      !paymentMethod ||
      !paymentDate
    ) {
      alert("Data pembayaran belum lengkap");
      return;
    }

    setLoading(true);

    try {
      await api.post("/payments", {
        billId,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        notes,
      });

      alert("Pembayaran berhasil");

      resetForm();

      await getTagihan();
      await getPembayaran();
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Gagal memproses pembayaran"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTagihan();
    getPembayaran();

    const today = new Date()
      .toISOString()
      .split("T")[0];

    setPaymentDate(today);
  }, []);

  const tagihanBelumBayar = tagihan.filter(
    (item) => item.status === "Belum Bayar"
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Pembayaran
        </h1>

        <p className="mt-1 text-gray-500">
          Kelola pembayaran tagihan siswa
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Proses Pembayaran
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={billId}
              onChange={(event) =>
                handleBillChange(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Pilih tagihan
              </option>

              {tagihanBelumBayar.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.Student?.nis} -{" "}
                  {item.Student?.name} -{" "}
                  {item.Item?.name} - Rp{" "}
                  {item.amount.toLocaleString("id-ID")}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={amount}
              readOnly
              placeholder="Nominal pembayaran"
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-600 outline-none"
            />

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Pilih metode pembayaran
              </option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
            </select>

            <input
              type="date"
              value={paymentDate}
              onChange={(event) =>
                setPaymentDate(event.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <textarea
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Memproses..."
              : "Proses Pembayaran"}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Riwayat Pembayaran
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Catatan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {pembayaran.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.paymentDate}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    Rp{" "}
                    {item.amount.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.paymentMethod}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.notes || "-"}
                  </td>
                </tr>
              ))}

              {pembayaran.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada riwayat pembayaran.
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

export default Payment;