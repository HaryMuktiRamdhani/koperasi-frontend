import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";

type Decision = "Naik Kelas" | "Tinggal Kelas" | "Calon Alumni" | "Tidak Diproses";

interface HistoryItem {
  id: string;
  batchId: string;
  studentId: string;
  nis: string;
  name: string;
  jurusanId: string | null;
  jurusanName: string | null;
  jurusanCode: string | null;
  fromClassName: string;
  toClassName: string;
  fromLevel: string;
  toLevel: string;
  action: Decision;
  fromAcademicYear: string;
  toAcademicYear: string;
  fromStatus: string;
  toStatus: string;
  processedAt: string;
  processedByName: string | null;
}

interface HistoryResponse {
  appliedAcademicYear: string;
  items: HistoryItem[];
  summary: {
    promote: number;
    stay: number;
    alumni: number;
    skip: number;
    total: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  options: {
    academicYears: { from: string; to: string; total: number }[];
    jurusan: { id: string; name: string | null; code: string | null }[];
  };
}

interface DetailResponse {
  item: HistoryItem;
  batch: { id: string; size: number };
  student: {
    id: string;
    nis: string;
    name: string;
    status: string;
    className: string | null;
    jurusanName: string | null;
  } | null;
  timeline: HistoryItem[];
}

const LEVELS = ["X", "XI", "XII"];
const DECISIONS: Decision[] = [
  "Naik Kelas",
  "Tinggal Kelas",
  "Calon Alumni",
  "Tidak Diproses",
];

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

function destinationLabel(item: HistoryItem) {
  if (item.action === "Calon Alumni") return `${item.toClassName} (Alumni)`;
  if (item.action === "Tinggal Kelas" || item.action === "Tidak Diproses") {
    return `${item.toClassName} (tetap)`;
  }
  return item.toClassName;
}

function statusLabel(item: HistoryItem) {
  return item.fromStatus === item.toStatus
    ? item.toStatus
    : `${item.fromStatus} → ${item.toStatus}`;
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

function RiwayatKenaikan() {
  const { formatDateTime } = useLanguage();

  // null = belum dipilih; server memakai tahun ajaran terbaru yang punya data
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params: Record<string, string | number> = { page, pageSize };
    if (yearFilter !== null) params.academicYear = yearFilter;
    if (levelFilter) params.level = levelFilter;
    if (majorFilter) params.jurusanId = majorFilter;
    if (decisionFilter) params.action = decisionFilter;
    if (search) params.search = search;

    api
      .get<HistoryResponse>("/promotions/history", { params })
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        // Halaman melebihi jumlah data (mis. setelah filter berubah)
        if (page > response.data.pagination.pageCount) {
          setPage(response.data.pagination.pageCount);
        }
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestMessage(requestError, "Riwayat kenaikan gagal dimuat."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    yearFilter,
    levelFilter,
    majorFilter,
    decisionFilter,
    search,
    page,
    pageSize,
    reloadKey,
  ]);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    api
      .get<DetailResponse>(`/promotions/history/${detailId}`)
      .then((response) => {
        if (!cancelled) setDetail(response.data);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setDetailError(
          requestMessage(requestError, "Detail riwayat gagal dimuat."),
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

  const appliedYear = data?.appliedAcademicYear ?? "";
  const selectedYear = yearFilter ?? appliedYear;
  const academicYears = data?.options.academicYears ?? [];
  const majors = data?.options.jurusan ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;
  const items = data?.items ?? [];

  const hasAnyHistory = academicYears.length > 0;
  const total = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? page;
  const pageCount = pagination?.pageCount ?? 1;

  const yearLabel = useMemo(() => {
    if (selectedYear === "all") return "Semua tahun ajaran";
    const found = academicYears.find((year) => year.from === selectedYear);
    return found ? `${found.from} → ${found.to}` : selectedYear;
  }, [selectedYear, academicYears]);

  const chips: [string, string][] = [
    levelFilter ? ["level", `Tingkat ${levelFilter}`] : ["", ""],
    majorFilter
      ? [
          "major",
          majors.find((item) => item.id === majorFilter)?.name || "Jurusan",
        ]
      : ["", ""],
    decisionFilter ? ["decision", decisionFilter] : ["", ""],
    search ? ["search", `Cari: ${search}`] : ["", ""],
  ];

  function removeFilter(key: string) {
    if (key === "level") setLevelFilter("");
    if (key === "major") setMajorFilter("");
    if (key === "decision") setDecisionFilter("");
    if (key === "search") {
      setSearchDraft("");
      setSearch("");
    }
    setPage(1);
  }

  function resetFilters() {
    setYearFilter(null);
    setLevelFilter("");
    setMajorFilter("");
    setDecisionFilter("");
    setSearchDraft("");
    setSearch("");
    setPage(1);
  }

  const summaryTiles: { label: string; value: number; decision: string }[] = [
    { label: "Total Riwayat", value: summary?.total ?? 0, decision: "" },
    { label: "Naik Kelas", value: summary?.promote ?? 0, decision: "Naik Kelas" },
    {
      label: "Tinggal Kelas",
      value: summary?.stay ?? 0,
      decision: "Tinggal Kelas",
    },
    {
      label: "Calon Alumni",
      value: summary?.alumni ?? 0,
      decision: "Calon Alumni",
    },
    {
      label: "Tidak Diproses",
      value: summary?.skip ?? 0,
      decision: "Tidak Diproses",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0"
          title="Riwayat Kenaikan"
          description="Riwayat proses kenaikan siswa per tahun ajaran"
          icon={History}
        />
        <Link
          to="/classes"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Kelas
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

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        {summaryTiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => {
              setDecisionFilter(tile.decision);
              setPage(1);
            }}
            aria-pressed={decisionFilter === tile.decision}
            className={`cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm dark:bg-[#111c2e] ${
              decisionFilter === tile.decision ? "ring-2 ring-[#168b87]" : ""
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

      <div className="min-w-0 rounded-xl bg-white shadow-sm dark:bg-[#111c2e]">
        <div className="border-b border-gray-200 p-4 dark:border-[#263449]">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Daftar Riwayat
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                {yearLabel}
              </p>
            </div>
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

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              aria-label="Filter tahun ajaran"
              value={selectedYear}
              onChange={(event) => {
                setYearFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">Semua tahun ajaran</option>
              {academicYears.map((year) => (
                <option key={year.from} value={year.from}>
                  {year.from} → {year.to}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter tingkat kelas"
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Semua tingkat</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  Kelas {level}
                </option>
              ))}
            </select>
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
              aria-label="Filter keputusan"
              value={decisionFilter}
              onChange={(event) => {
                setDecisionFilter(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Semua keputusan</option>
              {DECISIONS.map((decision) => (
                <option key={decision} value={decision}>
                  {decision}
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
              {Math.min(currentPage * pageSize, total)} dari {total} riwayat
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
              Memuat riwayat kenaikan...
            </div>
          ) : (
            <table
              className={`w-full min-w-275 text-left text-sm ${loading ? "opacity-60" : ""}`}
            >
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                <tr>
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">NIS</th>
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-5 py-3">Kelas Asal</th>
                  <th className="px-5 py-3">Kelas Tujuan</th>
                  <th className="px-5 py-3">Jurusan</th>
                  <th className="px-5 py-3">Keputusan</th>
                  <th className="px-5 py-3">Status Siswa</th>
                  <th className="px-5 py-3">Tanggal Proses</th>
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
                      {item.fromClassName}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {destinationLabel(item)}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.jurusanCode || item.jurusanName || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${decisionBadge(item.action)}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {statusLabel(item)}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {formatDateTime(item.processedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(item.id)}
                        aria-label={`Lihat detail riwayat ${item.name}`}
                        title="Lihat detail riwayat"
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
                      colSpan={10}
                      className="p-10 text-center text-gray-500 dark:text-[#a7b4c7]"
                    >
                      {error ? (
                        <p>Data tidak dapat ditampilkan.</p>
                      ) : hasAnyHistory ? (
                        <>
                          <p>Tidak ada riwayat yang cocok dengan filter.</p>
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
                          Belum ada riwayat kenaikan siswa. Proses kenaikan
                          dilakukan dari halaman Kelas.
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
            aria-labelledby="history-detail-title"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-[#263449]">
              <div>
                <h2
                  id="history-detail-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Detail Riwayat Kenaikan
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  {detail ? `${detail.item.name} • NIS ${detail.item.nis}` : ""}
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

              {detail && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 dark:bg-teal-950/30">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionBadge(detail.item.action)}`}
                    >
                      {detail.item.action}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-slate-100">
                      {detail.item.fromClassName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {destinationLabel(detail.item)}
                    </span>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Informasi Proses
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailField
                        label="Tahun ajaran"
                        value={`${detail.item.fromAcademicYear} → ${detail.item.toAcademicYear}`}
                      />
                      <DetailField
                        label="Tanggal proses"
                        value={formatDateTime(detail.item.processedAt)}
                      />
                      <DetailField
                        label="Tingkat"
                        value={
                          detail.item.fromLevel === detail.item.toLevel
                            ? detail.item.fromLevel
                            : `${detail.item.fromLevel} → ${detail.item.toLevel}`
                        }
                      />
                      <DetailField
                        label="Status siswa saat proses"
                        value={statusLabel(detail.item)}
                      />
                      <DetailField
                        label="Jurusan"
                        value={
                          detail.item.jurusanName
                            ? `${detail.item.jurusanName}${detail.item.jurusanCode ? ` (${detail.item.jurusanCode})` : ""}`
                            : ""
                        }
                      />
                      <DetailField
                        label="Diproses oleh"
                        value={detail.item.processedByName ?? ""}
                      />
                      <DetailField
                        label="Batch proses"
                        value={`${detail.batch.id.slice(0, 8)} • ${detail.batch.size} catatan`}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Kondisi Siswa Saat Ini
                    </h3>
                    {detail.student ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailField
                          label="Kelas saat ini"
                          value={detail.student.className ?? ""}
                        />
                        <DetailField
                          label="Status saat ini"
                          value={detail.student.status}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
                        Data siswa tidak ditemukan.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Seluruh Riwayat Siswa Ini
                    </h3>
                    <ol className="space-y-2">
                      {detail.timeline.map((entry) => (
                        <li
                          key={entry.id}
                          className={`rounded-lg border px-3 py-2.5 text-sm ${
                            entry.id === detail.item.id
                              ? "border-teal-600 bg-teal-50/60 dark:bg-teal-950/20"
                              : "border-gray-200 dark:border-[#263449]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              {entry.fromAcademicYear} → {entry.toAcademicYear}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${decisionBadge(entry.action)}`}
                            >
                              {entry.action}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-[#a7b4c7]">
                            {entry.fromClassName} → {destinationLabel(entry)} •{" "}
                            {formatDateTime(entry.processedAt)}
                          </p>
                        </li>
                      ))}
                    </ol>
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

export default RiwayatKenaikan;