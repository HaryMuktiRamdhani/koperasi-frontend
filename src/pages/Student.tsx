import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import {
  DEFAULT_STUDENT_FILTERS,
  normaliseStudentFilters,
  studentFiltersToParams,
  toggleStudentSort,
  type StudentFilterState,
  type StudentSortKey,
} from "../utils/studentFilters";

interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
  jurusanId: string;
  generation: string;
  status: string;
  Class?: { id: string; name: string; level: string; academicYear: string };
  Jurusan?: { id: string; nama: string; kode: string };
}
interface ClassData {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  status: string;
  jurusanIds?: string[];
}
interface Major {
  id: string;
  nama: string;
  kode: string;
}

const statuses = ["Aktif", "Lulus", "Pindah", "Keluar"];

function Student() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [filters, setFilters] = useState<StudentFilterState>(() =>
    normaliseStudentFilters(searchParams),
  );
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nis: "",
    name: "",
    classId: "",
    jurusanId: "",
    generation: "",
    status: "Aktif",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function updateFilters(patch: Partial<StudentFilterState>, replace = true) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setSearchParams(studentFiltersToParams(next), { replace });
  }

  useEffect(() => {
    const next = normaliseStudentFilters(searchParams);
    setFilters(next);
    setSearchDraft(next.search);
  }, [searchParams]);

  useEffect(() => {
    const urlFilters = normaliseStudentFilters(searchParams);
    if (searchDraft === urlFilters.search) return;
    const timer = window.setTimeout(() => {
      const next = { ...urlFilters, search: searchDraft, page: 1 };
      setFilters(next);
      setSearchParams(studentFiltersToParams(next), { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, searchParams]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [studentResponse, classResponse, majorResponse] = await Promise.all(
        [
          api.get<Student[]>("/students"),
          api.get<ClassData[]>("/classes"),
          api.get<Major[]>("/jurusan"),
        ],
      );
      setStudents(studentResponse.data);
      setClasses(classResponse.data);
      setMajors(majorResponse.data);
    } catch {
      setError("Data siswa, kelas, atau jurusan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const generations = useMemo(
    () =>
      [
        ...new Set(
          students.map((student) => student.generation).filter(Boolean),
        ),
      ].sort(),
    [students],
  );
  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return students
      .filter((student) => {
        const matchesSearch =
          !query ||
          `${student.name} ${student.nis}`.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (!filters.jurusanId || student.jurusanId === filters.jurusanId) &&
          (!filters.classId || student.classId === filters.classId) &&
          (!filters.generation || student.generation === filters.generation) &&
          (!filters.status || student.status === filters.status)
        );
      })
      .sort((a, b) => {
        const left =
          filters.sort === "class"
            ? a.Class?.name || ""
            : filters.sort === "name"
              ? a.name
              : filters.sort === "nis"
                ? a.nis
                : a.generation;
        const right =
          filters.sort === "class"
            ? b.Class?.name || ""
            : filters.sort === "name"
              ? b.name
              : filters.sort === "nis"
                ? b.nis
                : b.generation;
        return (
          left.localeCompare(right, "id", { numeric: true }) *
          (filters.direction === "asc" ? 1 : -1)
        );
      });
  }, [students, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * filters.pageSize,
    currentPage * filters.pageSize,
  );
  const relationIdsForClass = (classId: string) => {
    const selectedClass = classes.find((item) => item.id === classId);
    return selectedClass?.jurusanIds || [];
  };
  const relationKnownForClass = (classId: string, jurusanId: string) => {
    const relationIds = relationIdsForClass(classId);
    return relationIds.length === 0 || relationIds.includes(jurusanId);
  };
  const availableClasses = classes.filter(
    (item) => item.status === "Aktif" || item.id === form.classId,
  );
  const classOptions = filters.jurusanId
    ? availableClasses.filter((item) =>
        item.jurusanIds?.includes(filters.jurusanId),
      )
    : availableClasses;
  const formMajors = form.classId
    ? relationIdsForClass(form.classId).length > 0
      ? majors.filter((major) =>
          relationIdsForClass(form.classId).includes(major.id),
        )
      : majors
    : majors;
  const unverifiableStudents = students.filter(
    (student) => !student.Class || !student.Jurusan,
  );
  const inconsistentStudents = students.filter((student) => {
    const selectedClass = classes.find((item) => item.id === student.classId);
    if (!selectedClass?.jurusanIds?.length) return false;
    return !relationKnownForClass(student.classId, student.jurusanId);
  });

  function resetFilters() {
    setSearchDraft("");
    setFilters(DEFAULT_STUDENT_FILTERS);
    setSearchParams(studentFiltersToParams(DEFAULT_STUDENT_FILTERS), {
      replace: true,
    });
  }
  function removeFilter(
    key: keyof Pick<
      StudentFilterState,
      "jurusanId" | "classId" | "generation" | "status"
    >,
  ) {
    updateFilters({ [key]: "", page: 1 });
  }
  function sortBy(sort: StudentSortKey) {
    updateFilters({ ...toggleStudentSort(filters, sort), page: 1 });
  }
  function startEdit(student: Student) {
    setEditId(student.id);
    setForm({
      nis: student.nis,
      name: student.name,
      classId: student.classId,
      jurusanId: student.jurusanId,
      generation: student.generation,
      status: student.status || "Aktif",
    });
  }
  function resetForm() {
    setEditId(null);
    setForm({
      nis: "",
      name: "",
      classId: "",
      jurusanId: "",
      generation: "",
      status: "Aktif",
    });
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      !form.nis.trim() ||
      !form.name.trim() ||
      !form.classId ||
      !form.jurusanId ||
      !form.generation.trim()
    ) {
      setError("NIS, nama, kelas, jurusan, dan angkatan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (editId) await api.put(`/students/${editId}`, form);
      else await api.post("/students", form);
      resetForm();
      await loadData();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message || "Gagal menyimpan data siswa.",
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
      await api.delete(`/students/${deleteId}`);
      setDeleteId(null);
      await loadData();
    } catch (requestError: any) {
      setDeleteError(
        requestError.response?.data?.message || "Gagal menghapus siswa.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }
  function setClass(value: string) {
    const relationIds = relationIdsForClass(value);
    setForm((current) => ({
      ...current,
      classId: value,
      jurusanId:
        relationIds.length === 1
          ? relationIds[0]
          : current.jurusanId && relationKnownForClass(value, current.jurusanId)
            ? current.jurusanId
            : "",
    }));
  }
  const chips = [
    ["jurusanId", majors.find((item) => item.id === filters.jurusanId)?.nama],
    ["classId", classes.find((item) => item.id === filters.classId)?.name],
    ["generation", filters.generation],
    ["status", filters.status],
  ] as const;

  return (
    <div>
      <PageHeader
        className="mb-4"
        title="Siswa"
        description="Kelola data siswa sekolah"
        icon={Users}
      />
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {(unverifiableStudents.length > 0 || inconsistentStudents.length > 0) && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
        >
          Ditemukan {inconsistentStudents.length} kombinasi Kelas–Jurusan yang
          tidak sesuai metadata relasi dan {unverifiableStudents.length} data
          yang belum dapat diverifikasi. Data lama tidak diubah otomatis;
          periksa relasi pada sumber data.
        </div>
      )}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          {editId ? "Edit Siswa" : "Tambah Siswa"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            <input
              required
              placeholder="NIS"
              value={form.nis}
              onChange={(event) =>
                setForm({ ...form, nis: event.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nama siswa"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              required
              value={form.classId}
              onChange={(event) => setClass(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Pilih kelas</option>
              {availableClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.academicYear}
                </option>
              ))}
            </select>
            <select
              required
              value={form.jurusanId}
              onChange={(event) =>
                setForm({ ...form, jurusanId: event.target.value })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Pilih jurusan</option>
              {formMajors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} ({item.kode})
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Angkatan (contoh: 2024)"
              value={form.generation}
              onChange={(event) =>
                setForm({ ...form, generation: event.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          {form.classId && relationIdsForClass(form.classId).length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Kelas ini belum memiliki jurusan yang tersimpan pada data siswa.
              Pilih jurusan untuk menetapkan relasi pertama kelas ini.
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="min-w-0 rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Siswa
            </h2>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                aria-label="Cari nama atau NIS"
                placeholder="Cari nama atau NIS..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={filters.jurusanId}
              onChange={(event) =>
                updateFilters({
                  jurusanId: event.target.value,
                  classId: "",
                  page: 1,
                })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Semua jurusan</option>
              {majors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
            <select
              value={filters.classId}
              onChange={(event) =>
                updateFilters({ classId: event.target.value, page: 1 })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Semua kelas</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={filters.generation}
              onChange={(event) =>
                updateFilters({ generation: event.target.value, page: 1 })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Semua angkatan</option>
              {generations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) =>
                updateFilters({ status: event.target.value, page: 1 })
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">Semua status</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              <SlidersHorizontal className="h-4 w-4" /> Reset Filter
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">
              Menampilkan{" "}
              {filtered.length ? (currentPage - 1) * filters.pageSize + 1 : 0}-
              {Math.min(currentPage * filters.pageSize, filtered.length)} dari{" "}
              {filtered.length} siswa
            </span>
            {chips.map(
              ([key, label]) =>
                label && (
                  <button
                    key={key}
                    onClick={() => removeFilter(key)}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                  >
                    {label}
                    <X className="h-3 w-3" />
                  </button>
                ),
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Memuat data siswa...
            </div>
          ) : (
            <table className="w-full min-w-212.5 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">No</th>
                  {(
                    [
                      ["nis", "NIS"],
                      ["name", "Nama"],
                      ["class", "Kelas"],
                      ["generation", "Angkatan"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-5 py-3">
                      <button
                        onClick={() => sortBy(key)}
                        className="inline-flex items-center gap-1"
                      >
                        {label}
                        <span className="text-teal-600">
                          {filters.sort === key
                            ? filters.direction === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3">Jurusan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">
                      {(currentPage - 1) * filters.pageSize + index + 1}
                    </td>
                    <td className="px-5 py-3">{item.nis}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {item.Class?.name || "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {item.generation}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {item.Jurusan?.kode || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(item.id);
                            setDeleteError("");
                          }}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pageItems.length && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-500">
                      <p>
                        {filtered.length
                          ? "Halaman ini tidak memiliki data."
                          : "Tidak ada siswa yang cocok dengan filter."}
                      </p>
                      <button
                        onClick={resetFilters}
                        className="mt-3 font-medium text-teal-600"
                      >
                        Reset Filter
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <select
            value={filters.pageSize}
            onChange={(event) =>
              updateFilters({ pageSize: Number(event.target.value), page: 1 })
            }
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
          <div className="flex items-center gap-2 text-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() => updateFilters({ page: currentPage - 1 })}
              className="rounded border p-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Halaman {currentPage} dari {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => updateFilters({ page: currentPage + 1 })}
              className="rounded border p-1 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Hapus Siswa?"
        description="Data siswa yang dipilih akan dihapus. Tindakan ini tidak dapat dibatalkan."
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

export default Student;
