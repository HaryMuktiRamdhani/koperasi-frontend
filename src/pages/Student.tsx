import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
import type { ChangeEvent, FormEvent } from "react";
import * as XLSX from "xlsx";
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
import { getStoredRole } from "../utils/permissions";

interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
  jurusanId: string;
  generation: string;
  gender?: string | null;
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
  jurusanId?: string;
  jurusanIds?: string[];
}

interface Major {
  id: string;
  nama: string;
  kode: string;
}

interface ImportStudentRow {
  rowNumber: number;
  nis: string;
  name: string;
  gender: string;
  className: string;
  majorName: string;
  generation: string;
  status: string;
  errors: string[];
  payload?: {
    nis: string;
    name: string;
    gender: string;
    classId: string;
    jurusanId: string;
    generation: string;
    status: string;
  };
}

// Status "Lulus" (alumni) hanya diberikan oleh fitur Kenaikan Siswa kelas XII
const statuses = ["Aktif", "Pindah", "Keluar"];
const genders = ["Laki-laki", "Perempuan"];

const excelHeaders = [
  "NIS",
  "Nama Siswa",
  "Jenis Kelamin",
  "Kelas",
  "Jurusan",
  "Angkatan",
  "Status",
] as const;

// Menerima "Laki-laki", "Perempuan", atau singkatan "L" / "P".
function parseGender(value: string) {
  const key = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");

  if (["laki-laki", "laki laki", "pria", "l"].includes(key)) {
    return "Laki-laki";
  }

  if (["perempuan", "wanita", "p"].includes(key)) {
    return "Perempuan";
  }

  return "";
}

function Student() {
  const canDelete = getStoredRole() === "admin";
  const navigate = useNavigate();
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

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nis: "",
    name: "",
    classId: "",
    jurusanId: "",
    generation: "",
    gender: "",
    status: "Aktif",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportStudentRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importToast, setImportToast] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const [importSummary, setImportSummary] = useState<{
    imported: number;
    failed: number;
  } | null>(null);

  function updateFilters(
    patch: Partial<StudentFilterState>,
    replace = true,
  ) {
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
      const [studentResponse, classResponse, majorResponse] =
        await Promise.all([
          api.get<Student[]>("/students", {
            params: { status: "Aktif" },
          }),
          api.get<ClassData[]>("/classes"),
          api.get<Major[]>("/jurusan"),
        ]);

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

  useEffect(() => {
    if (!importToast) return;

    const timer = window.setTimeout(() => {
      setImportToast(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [importToast]);

  useEffect(() => {
    const editStudentId = searchParams.get("edit");

    if (!editStudentId || !students.length) return;

    const student = students.find((item) => item.id === editStudentId);

    if (!student) return;

    startEdit(student);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("edit");

    setSearchParams(nextParams, { replace: true });
  }, [students, searchParams, setSearchParams]);

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
          (!filters.generation ||
            student.generation === filters.generation) &&
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

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / filters.pageSize),
  );

  const currentPage = Math.min(filters.page, pageCount);

  const pageItems = filtered.slice(
    (currentPage - 1) * filters.pageSize,
    currentPage * filters.pageSize,
  );

  const relationIdsForClass = (classId: string) => {
    const selectedClass = classes.find((item) => item.id === classId);

    return selectedClass?.jurusanIds || [];
  };

  const relationKnownForClass = (
    classId: string,
    jurusanId: string,
  ) => {
    const relationIds = relationIdsForClass(classId);

    return (
      relationIds.length === 0 || relationIds.includes(jurusanId)
    );
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
    const selectedClass = classes.find(
      (item) => item.id === student.classId,
    );

    if (!selectedClass?.jurusanIds?.length) return false;

    return !relationKnownForClass(
      student.classId,
      student.jurusanId,
    );
  });

  const editingStudent = editId
    ? students.find((student) => student.id === editId)
    : undefined;

  function resetFilters() {
    setSearchDraft("");
    setFilters(DEFAULT_STUDENT_FILTERS);

    setSearchParams(
      studentFiltersToParams(DEFAULT_STUDENT_FILTERS),
      { replace: true },
    );
  }

  function removeFilter(
    key: keyof Pick<
      StudentFilterState,
      "jurusanId" | "classId" | "generation"
    >,
  ) {
    updateFilters({ [key]: "", page: 1 });
  }

  function sortBy(sort: StudentSortKey) {
    updateFilters({
      ...toggleStudentSort(filters, sort),
      page: 1,
    });
  }

  function startEdit(student: Student) {
    setEditId(student.id);
    setShowForm(true);

    setForm({
      nis: student.nis,
      name: student.name,
      classId: student.classId,
      jurusanId: student.jurusanId,
      generation: student.generation,
      gender: student.gender || "",
      status: student.status || "Aktif",
    });
  }

  function resetForm() {
    setEditId(null);
    setShowForm(false);

    setForm({
      nis: "",
      name: "",
      classId: "",
      jurusanId: "",
      generation: "",
      gender: "",
      status: "Aktif",
    });
  }

  function openAddForm() {
    resetForm();
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const payload = {
      nis: form.nis.trim(),
      name: form.name.trim(),
      classId: form.classId,
      jurusanId: form.jurusanId,
      generation: form.generation.trim(),
      gender: form.gender,
      status: form.status,
    };

    if (
      !payload.nis ||
      !payload.name ||
      !payload.classId ||
      !payload.jurusanId ||
      !payload.generation
    ) {
      setError(
        "NIS, nama, kelas, jurusan, dan angkatan wajib diisi.",
      );
      return;
    }

    // Wajib untuk siswa baru; siswa lama boleh dilengkapi nanti.
    if (!editId && !payload.gender) {
      setError("Jenis kelamin wajib dipilih untuk siswa baru.");
      return;
    }

    setSaving(true);

    try {
      if (editId) {
        await api.put(`/students/${editId}`, payload);
      } else {
        await api.post("/students", payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      const errorResponse = (
        requestError as AxiosError<{ message?: string }>
      ).response;

      setError(
        errorResponse?.data?.message ||
          "Gagal menyimpan data siswa.",
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
        requestError.response?.data?.message ||
          "Gagal menghapus siswa.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function cellText(value: unknown) {
    return String(value ?? "").trim();
  }

  function normaliseLookup(value: string) {
    return value
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("id-ID");
  }

  function formatWorkbookSheet(
    sheet: XLSX.WorkSheet,
    rowCount: number,
    includeDataTypes = true,
  ) {
    sheet["!cols"] = [
      14, 28, 16, 22, 30, 14, 16,
    ].map((wch) => ({ wch }));

    sheet["!autofilter"] = {
      ref: `A1:G${Math.max(rowCount, 1)}`,
    };

    for (
      let column = 0;
      column < excelHeaders.length;
      column += 1
    ) {
      const address = XLSX.utils.encode_cell({
        r: 0,
        c: column,
      });

      const headerCell = sheet[address];

      if (headerCell) {
        headerCell.s = {
          fill: { fgColor: { rgb: "168B87" } },
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
          },
          alignment: { horizontal: "center" },
          border: {
            bottom: {
              style: "thin",
              color: { rgb: "0F766E" },
            },
          },
        };
      }
    }

    if (!includeDataTypes) return;

    for (let row = 1; row < rowCount; row += 1) {
      const nisCell = sheet[
        XLSX.utils.encode_cell({ r: row, c: 0 })
      ];

      if (nisCell) {
        nisCell.t = "s";
        nisCell.z = "@";
      }

      const generationCell = sheet[
        XLSX.utils.encode_cell({ r: row, c: 5 })
      ];

      if (
        generationCell &&
        /^\d{4}$/.test(String(generationCell.v))
      ) {
        generationCell.t = "n";
        generationCell.v = Number(generationCell.v);
        generationCell.z = "0";
      }
    }
  }

  function downloadWorkbook(
    rows: (string | number)[][],
    fileName: string,
    instructions?: (string | number)[][],
  ) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);

    formatWorkbookSheet(sheet, rows.length);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "Data Siswa",
    );

    if (instructions) {
      const instructionSheet =
        XLSX.utils.aoa_to_sheet(instructions);

      instructionSheet["!cols"] = [
        { wch: 24 },
        { wch: 90 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        instructionSheet,
        "Petunjuk",
      );
    }

    XLSX.writeFile(workbook, fileName);
  }

  function downloadTemplate() {
    const templateClass =
      classes.find((item) => item.status === "Aktif") ||
      classes[0];

    const templateMajor =
      majors.find(
        (item) =>
          templateClass &&
          relationKnownForClass(templateClass.id, item.id),
      ) || majors[0];

    downloadWorkbook(
      [
        [...excelHeaders],
        [
          "2024001",
          "Contoh Nama Siswa",
          "Laki-laki",
          templateClass?.name || "Isi sesuai data master",
          templateMajor?.kode ||
            templateMajor?.nama ||
            "Isi sesuai data master",
          2024,
          "Aktif",
        ],
      ],
      "template_data_siswa.xlsx",
      [
        ["Kolom", "Petunjuk pengisian"],
        [
          "NIS",
          "Wajib diisi sebagai teks. Jangan menghapus angka nol di depan.",
        ],
        ["Nama Siswa", "Wajib diisi."],
        [
          "Jenis Kelamin",
          "Wajib diisi: Laki-laki atau Perempuan (boleh disingkat L / P).",
        ],
        [
          "Kelas",
          "Gunakan nama kelas yang tersedia pada menu Data Kelas.",
        ],
        [
          "Jurusan",
          "Gunakan nama atau kode jurusan dari data master.",
        ],
        ["Angkatan", "Gunakan tahun empat digit, contoh 2024."],
        [
          "Status",
          `Gunakan salah satu: ${statuses.join(", ")}.`,
        ],
        [
          "Catatan",
          "Hapus baris contoh sebelum mengimpor data sebenarnya.",
        ],
      ],
    );
  }

  function exportStudents() {
    downloadWorkbook(
      [
        [...excelHeaders],
        ...students.map((student) => [
          student.nis,
          student.name,
          student.gender || "",
          student.Class?.name || "",
          student.Jurusan?.nama ||
            student.Jurusan?.kode ||
            "",
          student.generation,
          student.status,
        ]),
      ],
      "data_siswa.xlsx",
    );
  }

  function closeImport() {
    if (importing) return;

    setImportOpen(false);
    setImportRows([]);
    setImportFileName("");
    setImportError("");
    setImportSummary(null);
  }

  async function handleImportFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setImportFileName(file.name);
    setImportError("");
    setImportSummary(null);

    try {
      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        throw new Error("File harus berformat .xlsx.");
      }

      const workbook = XLSX.read(
        await file.arrayBuffer(),
        { type: "array" },
      );

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("Sheet Data Siswa tidak ditemukan.");
      }

      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        firstSheet,
        {
          header: 1,
          defval: "",
          raw: false,
        },
      );

      const header = (rows[0] || []).map(cellText);

      if (
        header.length !== excelHeaders.length ||
        excelHeaders.some(
          (value, index) => header[index] !== value,
        )
      ) {
        throw new Error(
          `Header harus persis: ${excelHeaders.join(", ")}.`,
        );
      }

      const existingNis = new Set(
        students.map((student) =>
          normaliseLookup(student.nis),
        ),
      );

      const fileNis = new Set<string>();
      const parsedRows: ImportStudentRow[] = [];

      rows.slice(1).forEach((row, index) => {
        const values = row as unknown[];

        const [
          nis,
          name,
          rawGender,
          className,
          majorName,
          generation,
          rawStatus,
        ] = values
          .slice(0, excelHeaders.length)
          .map(cellText);

        if (
          ![
            nis,
            name,
            rawGender,
            className,
            majorName,
            generation,
            rawStatus,
          ].some(Boolean)
        ) {
          return;
        }

        const selectedGender = parseGender(rawGender);
        const errors: string[] = [];

        const nisKey = normaliseLookup(nis);

        const selectedClass = classes.find(
          (item) =>
            normaliseLookup(item.name) ===
            normaliseLookup(className),
        );

        const selectedMajor = majors.find((item) => {
          const lookup = normaliseLookup(majorName);

          return (
            normaliseLookup(item.nama) === lookup ||
            normaliseLookup(item.kode) === lookup
          );
        });

        const selectedStatus = statuses.find(
          (status) =>
            normaliseLookup(status) ===
            normaliseLookup(rawStatus),
        );

        if (!nis) {
          errors.push("NIS wajib diisi.");
        } else if (existingNis.has(nisKey)) {
          errors.push("NIS sudah terdaftar.");
        } else if (fileNis.has(nisKey)) {
          errors.push("NIS duplikat dalam file.");
        } else {
          fileNis.add(nisKey);
        }

        if (!name) {
          errors.push("Nama siswa wajib diisi.");
        }

        if (!rawGender) {
          errors.push("Jenis kelamin wajib diisi.");
        } else if (!selectedGender) {
          errors.push(
            "Jenis kelamin harus Laki-laki atau Perempuan.",
          );
        }

        if (!className) {
          errors.push("Kelas wajib diisi.");
        } else if (!selectedClass) {
          errors.push("Nama kelas tidak ditemukan.");
        } else if (selectedClass.status !== "Aktif") {
          errors.push("Kelas tidak berstatus Aktif.");
        }

        if (!majorName) {
          errors.push("Jurusan wajib diisi.");
        } else if (!selectedMajor) {
          errors.push(
            "Nama atau kode jurusan tidak ditemukan.",
          );
        }

        if (
          selectedClass &&
          selectedMajor &&
          !relationKnownForClass(
            selectedClass.id,
            selectedMajor.id,
          )
        ) {
          errors.push(
            "Jurusan tidak sesuai dengan relasi kelas.",
          );
        }

        if (!/^(19|20)\d{2}$/.test(generation)) {
          errors.push(
            "Angkatan harus berupa tahun empat digit yang valid.",
          );
        }

        if (!selectedStatus) {
          errors.push(
            `Status harus salah satu dari: ${statuses.join(", ")}.`,
          );
        }

        const parsed: ImportStudentRow = {
          rowNumber: index + 2,
          nis,
          name,
          gender: selectedGender || rawGender,
          className,
          majorName,
          generation,
          status: selectedStatus || rawStatus,
          errors,
        };

        if (
          !errors.length &&
          selectedClass &&
          selectedMajor &&
          selectedStatus
        ) {
          parsed.payload = {
            nis,
            name,
            gender: selectedGender,
            classId: selectedClass.id,
            jurusanId: selectedMajor.id,
            generation,
            status: selectedStatus,
          };
        }

        parsedRows.push(parsed);
      });

      if (!parsedRows.length) {
        throw new Error(
          "Tidak ada data siswa untuk diimpor.",
        );
      }

      setImportRows(parsedRows);
      setImportOpen(true);
    } catch (fileError) {
      setImportRows([]);
      setImportOpen(true);

      setImportError(
        fileError instanceof Error
          ? fileError.message
          : "File Excel tidak dapat dibaca.",
      );
    }
  }

  async function importValidRows() {
    const validRows = importRows.filter(
      (row) => row.payload,
    );

    if (!validRows.length || importing) return;

    setImporting(true);
    setImportError("");

    let imported = 0;
    let failed = 0;

    const nextRows = importRows.map((row) => ({
      ...row,
      errors: [...row.errors],
    }));

    for (const row of validRows) {
      try {
        await api.post("/students", row.payload);
        imported += 1;
      } catch (requestError) {
        failed += 1;

        const message = (
          requestError as AxiosError<{ message?: string }>
        ).response?.data?.message;

        const target = nextRows.find(
          (item) => item.rowNumber === row.rowNumber,
        );

        if (target) {
          target.errors = [
            message || "Gagal menyimpan data siswa.",
          ];

          delete target.payload;
        }
      }
    }

    setImportRows(nextRows);
    setImportSummary({ imported, failed });

    await loadData();

    if (failed === 0) {
      setImportToast({
        type: "success",
        message: `${imported} data siswa berhasil diimpor.`,
      });
    } else if (imported > 0) {
      setImportToast({
        type: "warning",
        message: `${imported} data berhasil diimpor, ${failed} data gagal disimpan.`,
      });
    } else {
      setImportToast({
        type: "error",
        message: `Import gagal. ${failed} data siswa tidak berhasil disimpan.`,
      });
    }

    setImporting(false);
  }

  function setClass(value: string) {
    const relationIds = relationIdsForClass(value);

    setForm((current) => ({
      ...current,
      classId: value,
      jurusanId:
        relationIds.length === 1
          ? relationIds[0]
          : current.jurusanId &&
              relationKnownForClass(
                value,
                current.jurusanId,
              )
            ? current.jurusanId
            : "",
    }));
  }

  const chips = [
    [
      "jurusanId",
      majors.find((item) => item.id === filters.jurusanId)?.nama,
    ],
    [
      "classId",
      classes.find((item) => item.id === filters.classId)?.name,
    ],
    ["generation", filters.generation],
  ] as const;

  const validImportCount = importRows.filter(
    (row) => row.payload,
  ).length;

  const invalidImportCount =
    importRows.length - validImportCount;

  return (
    <div className="student-page">
      {importToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-100 w-[calc(100%-2rem)] max-w-sm animate-[studentFadeUp_0.25s_ease-out] rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-[#111c2e]"
          style={{
            borderColor:
              importToast.type === "success"
                ? "#99f6e4"
                : importToast.type === "warning"
                  ? "#fcd34d"
                  : "#fca5a5",
          }}
        >
          <div className="flex items-start gap-3">
            {importToast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
            ) : (
              <AlertCircle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  importToast.type === "warning"
                    ? "text-amber-500"
                    : "text-red-500"
                }`}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {importToast.type === "success"
                  ? "Import berhasil"
                  : importToast.type === "warning"
                    ? "Import selesai sebagian"
                    : "Import gagal"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-[#a7b4c7]">
                {importToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportToast(null)}
              aria-label="Tutup notifikasi"
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#1b2a3d] dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes studentFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes studentFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .student-page {
          animation: studentFadeUp 0.45s ease-out both;
        }

        .student-section {
          animation: studentFadeUp 0.5s ease-out both;
        }

        .student-row {
          animation: studentFadeIn 0.35s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .student-page,
          .student-section,
          .student-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        className="student-section mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        style={{ animationDelay: "70ms" }}
      >
        <PageHeader
          className="mb-0"
          title="Siswa"
          description="Kelola data siswa sekolah"
          icon={Users}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/students/alumni")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
          >
            <GraduationCap className="h-4 w-4" />
            Data Alumni
          </button>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-teal-600 px-3 py-2 text-sm font-medium text-teal-700 dark:text-teal-300">
            <Upload className="h-4 w-4" />
            Import Excel

            <input
              type="file"
              accept=".xlsx"
              onChange={(event) =>
                void handleImportFile(event)
              }
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={exportStudents}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {(unverifiableStudents.length > 0 ||
        inconsistentStudents.length > 0) && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
        >
          Ditemukan {inconsistentStudents.length} kombinasi
          Kelas–Jurusan yang tidak sesuai metadata relasi dan{" "}
          {unverifiableStudents.length} data yang belum dapat
          diverifikasi. Data lama tidak diubah otomatis;
          periksa relasi pada sumber data.
        </div>
      )}

      {showForm && (
        <div
          className="student-section mb-4 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm"
          style={{ animationDelay: "70ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              {editId ? "Edit Siswa" : "Tambah Siswa"}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              aria-label="Tutup form"
              title="Tutup form"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              <input
                required
                placeholder="NIS"
                value={form.nis}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nis: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm"
              />

              <input
                required
                placeholder="Nama siswa"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm"
              />

              <select
                required={!editId}
                aria-label="Jenis kelamin"
                value={form.gender}
                onChange={(event) =>
                  setForm({
                    ...form,
                    gender: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm"
              >
                <option
                  value=""
                  disabled={Boolean(editingStudent?.gender)}
                >
                  Pilih jenis kelamin
                </option>

                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>

              <select
                required
                value={form.classId}
                onChange={(event) =>
                  setClass(event.target.value)
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm"
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
                  setForm({
                    ...form,
                    jurusanId: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm"
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
                  setForm({
                    ...form,
                    generation: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm"
              />

              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
                className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            {editId && !editingStudent?.gender && (
              <p className="mt-2 text-xs text-slate-500 dark:text-[#a7b4c7]">
                Jenis kelamin siswa ini belum diisi. Pilih
                jenis kelamin untuk melengkapi data.
              </p>
            )}

            {form.classId &&
              relationIdsForClass(form.classId).length === 0 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-[#a7b4c7]">
                  Kelas ini belum memiliki jurusan yang
                  tersimpan pada data siswa. Pilih jurusan
                  untuk menetapkan relasi pertama kelas ini.
                </p>
              )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? "Menyimpan..."
                  : editId
                    ? "Simpan Perubahan"
                    : "Tambah"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-[#a7b4c7]"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        className="student-section min-w-0 rounded-xl bg-white dark:bg-[#111c2e] shadow-sm"
        style={{ animationDelay: "120ms" }}
      >
        <div className="border-b border-gray-200 dark:border-[#263449] p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Daftar Siswa
            </h2>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500 dark:text-blue-300" />

              <input
                aria-label="Cari nama atau NIS"
                placeholder="Cari nama atau NIS..."
                value={searchDraft}
                onChange={(event) =>
                  setSearchDraft(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 dark:border-[#263449] py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.jurusanId}
              onChange={(event) =>
                updateFilters({
                  jurusanId: event.target.value,
                  classId: "",
                  page: 1,
                })
              }
              className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2"
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
                updateFilters({
                  classId: event.target.value,
                  page: 1,
                })
              }
              className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2"
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
                updateFilters({
                  generation: event.target.value,
                  page: 1,
                })
              }
              className="rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2"
            >
              <option value="">Semua angkatan</option>

              {generations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Reset Filter
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-[#a7b4c7]">
              Menampilkan{" "}
              {filtered.length
                ? (currentPage - 1) * filters.pageSize + 1
                : 0}
              -
              {Math.min(
                currentPage * filters.pageSize,
                filtered.length,
              )}{" "}
              dari {filtered.length} siswa
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
            <div className="p-10 text-center text-sm text-gray-500 dark:text-[#a7b4c7]">
              Memuat data siswa...
            </div>
          ) : (
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
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

                  <th className="px-5 py-3">
                    Jenis Kelamin
                  </th>

                  <th className="px-5 py-3">Jurusan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                {pageItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="student-row hover:bg-teal-50/70 dark:hover:bg-[#1b2a3d]"
                    style={{
                      animationDelay: `${Math.min(
                        index * 35,
                        350,
                      )}ms`,
                    }}
                  >
                    <td className="px-5 py-3 text-gray-500 dark:text-[#a7b4c7]">
                      {(currentPage - 1) *
                        filters.pageSize +
                        index +
                        1}
                    </td>

                    <td className="px-5 py-3">
                      {item.nis}
                    </td>

                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {item.name}
                    </td>

                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.Class?.name || "-"}
                    </td>

                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.generation}
                    </td>

                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.gender || (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">
                          Belum diisi
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.Jurusan?.kode || "-"}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === "Aktif"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                            : item.status === "Akan Datang"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/students/${item.id}`}
                          aria-label={`Lihat detail ${item.name}`}
                          title="Lihat detail siswa"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => startEdit(item)}
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          title="Edit siswa"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => {
                              setDeleteId(item.id);
                              setDeleteError("");
                            }}
                            type="button"
                            aria-label={`Hapus ${item.name}`}
                            title="Hapus siswa"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!pageItems.length && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-gray-500 dark:text-[#a7b4c7]"
                    >
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

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#263449] px-5 py-3">
          <select
            value={filters.pageSize}
            onChange={(event) =>
              updateFilters({
                pageSize: Number(event.target.value),
                page: 1,
              })
            }
            className="rounded border border-gray-300 dark:border-[#263449] px-2 py-1 text-sm"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>

          <div className="flex items-center gap-2 text-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() =>
                updateFilters({ page: currentPage - 1 })
              }
              className="rounded border p-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span>
              Halaman {currentPage} dari {pageCount}
            </span>

            <button
              disabled={currentPage >= pageCount}
              onClick={() =>
                updateFilters({ page: currentPage + 1 })
              }
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

      {importOpen &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#111c2e]">
              <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-[#263449]">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Import Data Siswa
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
                    {importFileName ||
                      "Pilih file .xlsx dengan template yang tersedia."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeImport}
                  disabled={importing}
                  aria-label="Tutup import"
                  className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed dark:hover:bg-[#1b2a3d]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(90vh-180px)] overflow-auto p-5">
                {importError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {importError}
                  </div>
                )}

                {importRows.length > 0 && (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        Valid: {validImportCount}
                      </span>

                      <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        Tidak valid: {invalidImportCount}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#263449]">
                      <table className="w-full min-w-225 text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                          <tr>
                            <th className="px-3 py-2">Baris</th>

                            {excelHeaders.map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2"
                              >
                                {header}
                              </th>
                            ))}

                            <th className="px-3 py-2">
                              Keterangan
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                          {importRows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td className="px-3 py-2">
                                {row.rowNumber}
                              </td>

                              <td className="px-3 py-2">
                                {row.nis}
                              </td>

                              <td className="px-3 py-2">
                                {row.name}
                              </td>

                              <td className="px-3 py-2">
                                {row.gender}
                              </td>

                              <td className="px-3 py-2">
                                {row.className}
                              </td>

                              <td className="px-3 py-2">
                                {row.majorName}
                              </td>

                              <td className="px-3 py-2">
                                {row.generation}
                              </td>

                              <td className="px-3 py-2">
                                {row.status}
                              </td>

                              <td
                                className={`px-3 py-2 text-xs ${
                                  row.errors.length
                                    ? "text-red-600 dark:text-red-300"
                                    : "text-green-600 dark:text-green-300"
                                }`}
                              >
                                {row.errors.length
                                  ? row.errors.join(" ")
                                  : "Siap diimpor"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {importSummary && (
                  <p className="mt-3 rounded-lg bg-teal-50 px-4 py-2.5 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                    Import selesai: {importSummary.imported} data
                    tersimpan dan {importSummary.failed} data gagal
                    disimpan.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 p-5 dark:border-[#263449]">
                <button
                  type="button"
                  onClick={closeImport}
                  disabled={importing}
                  className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed dark:bg-[#1b2a3d] dark:text-[#a7b4c7]"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => void importValidRows()}
                  disabled={
                    !validImportCount ||
                    importing ||
                    Boolean(importSummary)
                  }
                  className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing
                    ? "Menyimpan..."
                    : `Simpan ${validImportCount} Data Valid`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Student;