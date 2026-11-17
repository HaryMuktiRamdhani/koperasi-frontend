import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ImageOff,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import { useLanguage } from "../context/LanguageContext";

type ItemStatus = "Aktif" | "Nonaktif" | "Akan Datang";
type StatusFilter = "Semua" | ItemStatus;
type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "newest";

interface BarangData {
  id: string;
  name: string;
  price: number;
  status?: ItemStatus;
  imageUrl?: string | null;
  createdAt?: string;
}

interface BarangPayload {
  name: string;
  price: number;
  status: ItemStatus;
  // undefined = gambar tidak diubah, null = hapus gambar, string = gambar baru
  imageData?: string | null;
}

const STATUS_OPTIONS: ItemStatus[] = ["Aktif", "Nonaktif", "Akan Datang"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2.5 text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function resolveImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  if (/^(https?:|data:)/.test(imageUrl)) return imageUrl;
  const baseUrl = api.defaults.baseURL || window.location.origin;
  return new URL(imageUrl, baseUrl).toString();
}

function statusOf(item: BarangData): ItemStatus {
  return item.status || "Aktif";
}

function statusClass(status: ItemStatus) {
  if (status === "Aktif") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }
  if (status === "Akan Datang") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "bg-gray-100 dark:bg-[#1b2a3d] text-gray-600 dark:text-gray-300";
}

interface ItemThumbProps {
  src: string | null;
  alt: string;
  sizeClass: string;
}

function ItemThumb({ src, alt, sizeClass }: ItemThumbProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-[#1b2a3d] dark:text-[#64748b]`}
        title="Belum ada gambar"
      >
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 rounded-lg border border-gray-200 object-cover dark:border-[#263449]`}
    />
  );
}

function Item() {
  const { formatCurrency } = useLanguage();

  const [barang, setBarang] = useState<BarangData[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<ItemStatus>("Aktif");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function getBarang() {
    try {
      const response = await api.get<BarangData[]>("/items");
      setBarang(response.data);
      setListError("");
    } catch (error) {
      console.error("Gagal mengambil data barang", error);
      setListError("Data barang gagal dimuat.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    void getBarang();
  }, []);

  const counts = useMemo(() => {
    return {
      total: barang.length,
      aktif: barang.filter((item) => statusOf(item) === "Aktif").length,
      nonaktif: barang.filter((item) => statusOf(item) === "Nonaktif").length,
      akanDatang: barang.filter((item) => statusOf(item) === "Akan Datang")
        .length,
    };
  }, [barang]);

  const filteredBarang = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = barang.filter((item) => {
      const matchStatus =
        statusFilter === "Semua" || statusOf(item) === statusFilter;
      const matchName = !keyword || item.name.toLowerCase().includes(keyword);
      return matchStatus && matchName;
    });

    result.sort((a, b) => {
      if (sortBy === "name-desc") return b.name.localeCompare(a.name, "id");
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
      return a.name.localeCompare(b.name, "id");
    });

    return result;
  }, [barang, search, statusFilter, sortBy]);

  const filterActive =
    search.trim() !== "" || statusFilter !== "Semua" || sortBy !== "name-asc";

  function resetFilters() {
    setSearch("");
    setStatusFilter("Semua");
    setSortBy("name-asc");
  }

  function resetForm() {
    setEditId(null);
    setName("");
    setPrice("");
    setStatus("Aktif");
    setImagePreview(null);
    setImageChanged(false);
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: BarangData) {
    resetForm();
    setEditId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setStatus(statusOf(item));
    setImagePreview(resolveImageUrl(item.imageUrl));
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    resetForm();
  }

  useEffect(() => {
    if (!modalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setModalOpen(false);
        resetForm();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, saving]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError("Gambar harus berformat PNG, JPG, JPEG, atau WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("Ukuran gambar maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
        setImageChanged(true);
        setFormError("");
      }
    };
    reader.onerror = () => setFormError("Gambar gagal dibaca. Coba file lain.");
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setImageChanged(true);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const trimmedName = name.trim();
    const priceNumber = Number(price);

    if (!trimmedName) {
      setFormError("Nama barang wajib diisi.");
      return;
    }

    if (price === "" || !Number.isInteger(priceNumber) || priceNumber < 0) {
      setFormError("Harga harus berupa angka bulat 0 atau lebih.");
      return;
    }

    const payload: BarangPayload = {
      name: trimmedName,
      price: priceNumber,
      status,
    };

    if (imageChanged) {
      payload.imageData = imagePreview;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editId) {
        await api.put(`/items/${editId}`, payload);
      } else {
        await api.post("/items", payload);
      }

      setModalOpen(false);
      resetForm();
      await getBarang();
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Gagal menyimpan data barang",
      );
    } finally {
      setSaving(false);
    }
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

  const pricePreview =
    price !== "" && Number.isFinite(Number(price)) && Number(price) >= 0
      ? formatCurrency(Number(price))
      : null;

  const summaryTiles: { label: string; value: number; filter: StatusFilter }[] =
    [
      { label: "Semua Barang", value: counts.total, filter: "Semua" },
      { label: "Aktif", value: counts.aktif, filter: "Aktif" },
      { label: "Nonaktif", value: counts.nonaktif, filter: "Nonaktif" },
      { label: "Akan Datang", value: counts.akanDatang, filter: "Akan Datang" },
    ];

  return (
    <div>
      <PageHeader
        title="Barang"
        description="Kelola data barang koperasi"
        icon={Package}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryTiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => setStatusFilter(tile.filter)}
            aria-pressed={statusFilter === tile.filter}
            className={`cursor-pointer rounded-xl bg-white dark:bg-[#111c2e] p-4 text-left shadow-sm ${
              statusFilter === tile.filter ? "ring-2 ring-[#168b87]" : ""
            }`}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {tile.value}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama barang..."
              aria-label="Cari nama barang"
              className={`${inputClass} pl-10`}
            />
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-44">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className={`${inputClass} mt-1 font-normal`}
            >
              <option value="Semua">Semua status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-48">
            Urutkan
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className={`${inputClass} mt-1 font-normal`}
            >
              <option value="name-asc">Nama A - Z</option>
              <option value="name-desc">Nama Z - A</option>
              <option value="price-asc">Harga termurah</option>
              <option value="price-desc">Harga termahal</option>
              <option value="newest">Terbaru ditambahkan</option>
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!filterActive}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-4 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-200 dark:border-[#263449] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Daftar Barang
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
            Menampilkan {filteredBarang.length} dari {barang.length} barang
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Gambar</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
              {filteredBarang.map((item, index) => {
                const imageSrc = resolveImageUrl(item.imageUrl);
                const itemStatus = statusOf(item);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1b2a3d]"
                  >
                    <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                      {index + 1}
                    </td>

                    <td className="px-6 py-3">
                      <ItemThumb
                        key={imageSrc ?? "tanpa-gambar"}
                        src={imageSrc}
                        alt={item.name}
                        sizeClass="h-12 w-12"
                      />
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                      {item.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(itemStatus)}`}
                      >
                        {itemStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit ${item.name}`}
                          title="Edit barang"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteId(item.id);
                            setDeleteError("");
                          }}
                          aria-label={`Hapus ${item.name}`}
                          title="Hapus barang"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBarang.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-[#a7b4c7]"
                  >
                    {listLoading ? (
                      "Memuat data barang..."
                    ) : listError ? (
                      <div>
                        <p className="mb-3">{listError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setListLoading(true);
                            void getBarang();
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          Coba lagi
                        </button>
                      </div>
                    ) : barang.length === 0 ? (
                      <div>
                        <p className="mb-3">Belum ada data barang.</p>
                        <button
                          type="button"
                          onClick={openCreate}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          Tambah barang pertama
                        </button>
                      </div>
                    ) : (
                      "Tidak ada barang yang cocok dengan filter."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-[#111c2e] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
              <div>
                <h2
                  id="item-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  {editId ? "Edit Barang" : "Tambah Barang"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  {editId
                    ? "Perbarui data barang koperasi."
                    : "Isi data barang yang akan dijual di koperasi."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="px-6 py-5">
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]">
                  Gambar Barang
                </p>
                <div className="flex items-center gap-4">
                  <ItemThumb
                    key={imagePreview ?? "tanpa-gambar"}
                    src={imagePreview}
                    alt="Pratinjau gambar barang"
                    sizeClass="h-24 w-24"
                  />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-100 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ImagePlus className="h-4 w-4" />
                        {imagePreview ? "Ganti Gambar" : "Pilih Gambar"}
                      </button>

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-[#a7b4c7]">
                      PNG, JPG, atau WEBP. Maksimal 2MB.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="item-name"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                >
                  Nama Barang
                </label>
                <input
                  id="item-name"
                  type="text"
                  value={name}
                  maxLength={150}
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Baju Batik"
                  className={inputClass}
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="item-price"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                  >
                    Harga
                  </label>
                  <input
                    id="item-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Contoh: 50000"
                    className={inputClass}
                  />
                  {pricePreview && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-[#a7b4c7]">
                      Tampil sebagai {pricePreview}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="item-status"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                  >
                    Status Barang
                  </label>
                  <select
                    id="item-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ItemStatus)
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-5 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : editId
                      ? "Simpan Perubahan"
                      : "Tambah Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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