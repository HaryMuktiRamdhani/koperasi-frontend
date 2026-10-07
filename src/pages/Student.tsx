import { useState, useEffect } from "react";
import api from "../services/api";

interface SiswaData {
    id: string;
    nama: string;
    kelasId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

function Siswa() {
    const [siswa, setSiswa] = useState<SiswaData[]>([]);

    async function getsiswa() {
        try {
            const response = await api.get("/students");
            setSiswa(response.data);
        } catch (error) {
            console.error("Gagal mengambil data siswa", error);
        }
    }

    useEffect(() => {
        getsiswa();
    }, []);

    return (
        <div>
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-blue-500">SISWA</h1>
                <p className="mt-1 font-bold text-gray-600">
                    Daftar siswa
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Daftar Siswa
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {siswa.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-gray-600">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.nama}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {item.isActive ? "Aktif" : "Nonaktif"}
                                    </td>
                                </tr>
                            ))}
                            {siswa.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-6 py-10 text-center text-gray-500"
                                    >
                                        Belum ada data siswa.
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

export default Siswa;