import { useEffect, useState } from "react";
import api from "../services/api";

interface BarangData {
    id: string;
    nama: string;
    harga: number;
    stok: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

function Barang() {
    const [barang, setBarang] = useState<BarangData[]>([]);
    useEffect(() => {
        api.get("/barang")
            .then((response) => {
                setBarang(response.data);
            })
            .catch((error) => {
                console.error("Error fetching barang:", error);
            });
    }, []);
    return (
        <div>
            <div>
                <h1 className="font-bold text-blue-500 mt-1 text-2xl">DAFTAR ITEM</h1>
                <p className="font-bold mt-1 text-gray-600">Daftar item yang tersedia</p>
            </div>
            
        </div>
    );
}

export default Barang;