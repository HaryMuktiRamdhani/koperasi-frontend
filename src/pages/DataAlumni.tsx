import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";

interface AlumniItem {
  id: string;
  nis: string;
  name: string;
  gender: string | null;
  jurusanId: string | null;
  jurusanName: string | null;
  jurusanCode: string | null;
  generation: string;
  lastClassName: string | null;
  graduationYear: number | null;
  graduatedAt: string | null;
}

interface AlumniResponse {
  items: AlumniItem[];
  summary: {
    total: number;
    male: number;
    female: number;
    genderMissing: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  options: {
    jurusan: { id: string; name: string | null; code: string | null }[];
    generations: string[];
    graduationYears: number[];
  };
}

interface PromotionEntry {
  id: string;
  fromAcademicYear: string;
  toAcademicYear: string;
  fromClassName: string;
  toClassName: string;
  fromLevel: string;
  toLevel: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  processedAt: string;
  processedByName: string | null;
}

interface AlumniDetail {
  alumni: {
    id: string;
    nis: string;
    name: string;
    gender: string | null;
    generation: string;
    jurusanName: string | null;
    jurusanCode: string | null;
    lastClassName: string | null;
    lastClassAcademicYear: string | null;
    graduationYear: number | null;
    graduationAcademicYear: string | null;
    graduatedAt: string | null;
    processedByName: string | null;
    viaPromotion: boolean;
  };
  promotions: PromotionEntry[];
  koperasi: {
    summary: {
      billCount: number;
      totalBilled: number;
      unpaidCount: number;
      unpaidAmount: number;
      paymentCount: number;
      totalPaid: number;
    };
    bills: {
      id: string;
      itemName: string | null;
      amount: number;
      billDate: string | null;
      dueDate: string | null;
      status: string;
    }[];
    payments: {
      id: string;
      billId: string;
      itemName: string | null;
      amount: number;
      paymentMethod: string;
      paymentDate: string;
      notes: string | null;
    }[];
  };
}

const selectClass =
  "rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm";

function decisionBadge(action: string) {
  if (action === "Naik Kelas") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }
  if (action === "Tinggal Kelas") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (action === "Calon Alumni") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

function requestMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string } } })
    .response?.data;
  return data?.message || fallback;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2.5 dark:border-[#263449]">
      <p className="text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
        {label}
      </p>
      <p className="wrap-break-word text-sm font-medium text-gray-900 dark:text-slate-100">
        {value || "-"}
      </p>
    </div>
  );
}

function DataAlumni() {
  const { formatCurrency, formatDate, formatDateTime } = useLanguage();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get("q") || "";
  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch.trim());
  const [majorFilter, setMajorFilter] = useState("");
  const [generationFilter, setGenerationFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<AlumniResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AlumniDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  // Pencarian, filter, dan pagination diproses di backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params: Record<string, string | number> = { page, pageSize };
    if (search) params.search = search;
    if (majorFilter) params.jurusanId = majorFilter;
    if (generationFilter) params.generation = generationFilter;
    if (yearFilter) params.graduationYear = yearFilter;

    api
      .get<AlumniResponse>("/alumni", { params })
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        if (page > response.data.pagination.pageCount) {
          setPage(response.data.pagination.pageCount);
        }
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestMessage(requestError, "Data alumni gagal dimuat."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, majorFilter, generationFilter, yearFilter, page, pageSize, reloadKey]);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    api
      .get<AlumniDetail>(`/alumni/${detailId}`)
      .then((response) => {
        if (!cancelled) setDetail(response.data);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setDetailError(
          requestMessage(requestError, "Detail alumni gagal dimuat."),
        );
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailId]);

  useEffect(() => {
    if (!detailId) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDetailId(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailId]);

  const items = data?.items ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;
  const majors = data?.options.jurusan ?? [];
  const generations = data?.options.generations ?? [];
  const graduationYears = data?.options.graduationYears ?? [];

  const total = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? page;
  const pageCount = pagination?.pageCount ?? 1;
  const hasAnyAlumni = (summary?.total ?? 0) > 0;

  const chips: [string, string][] = [
    majorFilter
      ? [
          "major",
          majors.find((item) => item.id === majorFilter)?.name || "Jurusan",
        ]
      : ["", ""],
    generationFilter ? ["generation", `Angkatan ${generationFilter}`] : ["", ""],
    yearFilter ? ["year", `Lulus ${yearFilter}`] : ["", ""],
    search ? ["search", `Cari: ${search}`] : ["", ""],
  ];

  function removeFilter(key: string) {
    if (key === "major") setMajorFilter("");
    if (key === "generation") setGenerationFilter("");
    if (key === "year") setYearFilter("");
    if (key === "search") {
      setSearchDraft("");
      setSearch("");
    }
    setPage(1);
  }

  function resetFilters() {
    setMajorFilter("");
    setGenerationFilter("");
    setYearFilter("");
    setSearchDraft("");
    setSearch("");
    setPage(1);
  }

  const summaryTiles: { label: string; value: number }[] = [
    { label: "Total Alumni", value: summary?.total ?? 0 },
    { label: "Laki-laki", value: summary?.male ?? 0 },
    { label: "Perempuan", value: summary?.female ?? 0 },
    { label: "Gender Belum Diisi", value: summary?.genderMissing ?? 0 },
  ];

  const koperasi = detail?.koperasi;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0"
          title="Data Alumni"
          description="Daftar siswa yang telah lulus melalui proses Kenaikan Siswa"
          icon={GraduationCap}
        />
        <Link
          to="/students"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Siswa
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="cursor-pointer font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#111c2e]"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="min-w-0 rounded-xl bg-white shadow-sm dark:bg-[#111c2e]">
        <div className="border-b border-gray-200 p-4 dark:border-[#263449]">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Daftar Alumni
            </h2>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500 dark:text-blue-300" />
              <input
                aria-label="Cari nama atau NIS"
                placeholder="Cari nama atau NIS..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-[#263449]"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select
              aria-label="Filter jurusan"
              value={majorFilter}
              onChange={(event) => {
                setMajorFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Semua jurusan</option>
              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter angkatan"
              value={generationFilter}
              onChange={(event) => {
                setGenerationFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Semua angkatan</option>
              {generations.map((generation) => (
                <option key={generation} value={generation}>
                  {generation}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter tahun kelulusan"
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Semua tahun kelulusan</option>
              {graduationYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 dark:border-[#263449] dark:text-[#a7b4c7]"
            >
              <SlidersHorizontal className="h-4 w-4" /> Reset Filter
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-[#a7b4c7]">
              Menampilkan {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, total)} dari {total} alumni
            </span>
            {chips.map(
              ([key, label]) =>
                label && (
                  <button
                    key={key}
                    type="button"
                    onClick={() => removeFilter(key)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  >
                    {label}
                    <X className="h-3 w-3" />
                  </button>
                ),
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && !data ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500 dark:text-[#a7b4c7]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Memuat data alumni...
            </div>
          ) : (
            <table
              className={`w-full min-w-250 text-left text-sm ${loading ? "opacity-60" : ""}`}
            >
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                <tr>
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">NIS</th>
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-5 py-3">Jenis Kelamin</th>
                  <th className="px-5 py-3">Jurusan</th>
                  <th className="px-5 py-3">Angkatan</th>
                  <th className="px-5 py-3">Kelas Terakhir</th>
                  <th className="px-5 py-3">Tahun Kelulusan</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1b2a3d]"
                  >
                    <td className="px-5 py-3 text-gray-500 dark:text-[#a7b4c7]">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-5 py-3">{item.nis}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.gender || (
                        <span className="text-gray-400 dark:text-[#64748b]">
                          Belum diisi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.jurusanCode || item.jurusanName || "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.generation}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.lastClassName || "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.graduationYear ?? "-"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(item.id)}
                        aria-label={`Lihat detail alumni ${item.name}`}
                        title="Lihat detail alumni"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-gray-500 dark:text-[#a7b4c7]"
                    >
                      {error ? (
                        <p>Data tidak dapat ditampilkan.</p>
                      ) : hasAnyAlumni ? (
                        <>
                          <p>Tidak ada alumni yang cocok dengan filter.</p>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-3 cursor-pointer font-medium text-teal-600"
                          >
                            Reset Filter
                          </button>
                        </>
                      ) : (
                        <p>
                          Belum ada alumni. Siswa menjadi alumni setelah kelas
                          XII diproses melalui fitur Kenaikan Siswa di halaman
                          Kelas.
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-[#263449]">
          <select
            aria-label="Jumlah data per halaman"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-[#263449]"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded border p-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Halaman {currentPage} dari {pageCount}
            </span>
            <button
              type="button"
              aria-label="Halaman berikutnya"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="rounded border p-1 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alumni-detail-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-[#263449]">
              <div>
                <h2
                  id="alumni-detail-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Detail Alumni
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  {detail
                    ? `${detail.alumni.name} • NIS ${detail.alumni.nis}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Tutup"
                className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {detailLoading && (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Memuat detail...
                </div>
              )}

              {detailError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                >
                  {detailError}
                </p>
              )}

              {detail && koperasi && (
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Identitas Alumni
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailField label="NIS" value={detail.alumni.nis} />
                      <DetailField label="Nama" value={detail.alumni.name} />
                      <DetailField
                        label="Jenis kelamin"
                        value={detail.alumni.gender ?? "Belum diisi"}
                      />
                      <DetailField
                        label="Jurusan"
                        value={
                          detail.alumni.jurusanName
                            ? `${detail.alumni.jurusanName}${detail.alumni.jurusanCode ? ` (${detail.alumni.jurusanCode})` : ""}`
                            : ""
                        }
                      />
                      <DetailField
                        label="Angkatan"
                        value={detail.alumni.generation}
                      />
                      <DetailField
                        label="Kelas terakhir"
                        value={
                          detail.alumni.lastClassName
                            ? `${detail.alumni.lastClassName}${detail.alumni.lastClassAcademicYear ? ` (${detail.alumni.lastClassAcademicYear})` : ""}`
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Kelulusan
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailField
                        label="Tahun kelulusan"
                        value={
                          detail.alumni.graduationYear
                            ? String(detail.alumni.graduationYear)
                            : ""
                        }
                      />
                      <DetailField
                        label="Tahun ajaran kelulusan"
                        value={detail.alumni.graduationAcademicYear ?? ""}
                      />
                      <DetailField
                        label="Tanggal diproses"
                        value={
                          detail.alumni.graduatedAt
                            ? formatDateTime(detail.alumni.graduatedAt)
                            : ""
                        }
                      />
                      <DetailField
                        label="Diproses oleh"
                        value={detail.alumni.processedByName ?? ""}
                      />
                    </div>
                    {!detail.alumni.viaPromotion && (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
                        Status lulus siswa ini berasal dari data lama dan tidak
                        memiliki catatan Kenaikan Siswa. Tahun kelulusan
                        diperkirakan dari periode kelas terakhir.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Riwayat Kelas &amp; Kenaikan
                    </h3>
                    {detail.promotions.length ? (
                      <ol className="space-y-2">
                        {detail.promotions.map((entry) => (
                          <li
                            key={entry.id}
                            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-[#263449]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium text-gray-900 dark:text-slate-100">
                                {entry.fromAcademicYear} →{" "}
                                {entry.toAcademicYear}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${decisionBadge(entry.action)}`}
                              >
                                {entry.action}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-[#a7b4c7]">
                              {entry.fromClassName} →{" "}
                              {entry.toLevel === "Alumni"
                                ? `${entry.toClassName} (Alumni)`
                                : entry.toClassName}{" "}
                              • {formatDateTime(entry.processedAt)}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
                        Belum ada catatan kenaikan untuk siswa ini.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Transaksi Koperasi
                    </h3>
                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <DetailField
                        label="Total tagihan"
                        value={`${koperasi.summary.billCount} • ${formatCurrency(koperasi.summary.totalBilled)}`}
                      />
                      <DetailField
                        label="Sudah dibayar"
                        value={`${koperasi.summary.paymentCount} • ${formatCurrency(koperasi.summary.totalPaid)}`}
                      />
                      <DetailField
                        label="Belum lunas"
                        value={`${koperasi.summary.unpaidCount} • ${formatCurrency(koperasi.summary.unpaidAmount)}`}
                      />
                    </div>

                    {koperasi.bills.length ? (
                      <div className="mb-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-[#263449]">
                        <table className="w-full min-w-125 text-left text-sm">
                          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                            <tr>
                              <th className="px-3 py-2">Tagihan</th>
                              <th className="px-3 py-2">Jumlah</th>
                              <th className="px-3 py-2">Tanggal</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                            {koperasi.bills.map((bill) => (
                              <tr key={bill.id}>
                                <td className="px-3 py-2 text-gray-900 dark:text-slate-100">
                                  {bill.itemName || "-"}
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-[#a7b4c7]">
                                  {formatCurrency(bill.amount)}
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-[#a7b4c7]">
                                  {bill.billDate ? formatDate(bill.billDate) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      bill.status === "Lunas"
                                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                    }`}
                                  >
                                    {bill.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mb-3 text-sm text-gray-500 dark:text-[#a7b4c7]">
                        Tidak ada tagihan koperasi.
                      </p>
                    )}

                    {koperasi.payments.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#263449]">
                        <table className="w-full min-w-125 text-left text-sm">
                          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                            <tr>
                              <th className="px-3 py-2">Tanggal bayar</th>
                              <th className="px-3 py-2">Tagihan</th>
                              <th className="px-3 py-2">Metode</th>
                              <th className="px-3 py-2">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                            {koperasi.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-3 py-2 text-gray-600 dark:text-[#a7b4c7]">
                                  {formatDate(payment.paymentDate)}
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-slate-100">
                                  {payment.itemName || "-"}
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-[#a7b4c7]">
                                  {payment.paymentMethod}
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-slate-100">
                                  {formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-200 p-5 dark:border-[#263449]">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataAlumni;