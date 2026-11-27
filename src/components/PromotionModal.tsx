
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lock,
  LoaderCircle,
  TrendingUp,
  X,
} from "lucide-react";
import api from "../services/api";

type PromotionAction = "promote" | "stay" | "skip";
type Step = "select" | "preview";

interface PromotionStudent {
  id: string;
  nis: string;
  name: string;
  generation: string;
  locked: boolean;
  lockedReason: string | null;
}

interface PromotionDestination {
  id: string;
  name: string;
  academicYear: string;
  sameCohort: boolean;
}

interface PromotionGroup {
  classId: string;
  className: string;
  level: string;
  nextLevel: string | null;
  academicYear: string;
  jurusanId: string | null;
  jurusanName: string | null;
  jurusanCode: string | null;
  mixedJurusan: boolean;
  destinations: PromotionDestination[];
  suggestedDestinationId: string | null;
  students: PromotionStudent[];
}

interface EligibleResponse {
  fromAcademicYear: string;
  toAcademicYear: string;
  defaultFromAcademicYear: string;
  groups: PromotionGroup[];
}

interface PlanRow {
  studentId: string;
  nis: string;
  name: string;
  fromClassName: string;
  toClassName: string;
  fromLevel: string;
  toLevel: string;
  action: string;
  fromStatus: string;
  toStatus: string;
}

interface PreviewResponse {
  fromAcademicYear: string;
  toAcademicYear: string;
  valid: boolean;
  summary: {
    promote: number;
    stay: number;
    alumni: number;
    skip: number;
  };
  rows: PlanRow[];
  errors: string[];
  warnings: string[];
}

interface PromotionModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
}

const LEVELS = ["X", "XI", "XII"];

const selectClass =
  "rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm";

function actionBadge(action: string) {
  if (action === "Naik Kelas") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }

  if (action === "Tinggal Kelas") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
}

function yearStart(value: string) {
  return Number(value.slice(0, 4));
}

function requestMessage(error: unknown, fallback: string) {
  const data = (
    error as {
      response?: {
        data?: {
          message?: string;
          errors?: string[];
        };
      };
    }
  ).response?.data;

  if (data?.errors?.length) return data.errors.join(" ");

  return data?.message || fallback;
}

function PromotionModal({
  open,
  onClose,
  onCompleted,
}: PromotionModalProps) {
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [defaultYear, setDefaultYear] = useState("");
  const [groups, setGroups] = useState<PromotionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [levelFilter, setLevelFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [actions, setActions] = useState<
    Record<string, PromotionAction>
  >({});
  const [destinations, setDestinations] = useState<
    Record<string, string>
  >({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [step, setStep] = useState<Step>("select");
  const [plan, setPlan] = useState<PreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadGroups = useCallback(async (year?: string) => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get<EligibleResponse>(
        "/promotions/eligible",
        {
          params: year ? { fromYear: year } : {},
        },
      );

      const data = response.data;

      const nextActions: Record<string, PromotionAction> = {};
      const nextDestinations: Record<string, string> = {};

      data.groups.forEach((group) => {
        group.students.forEach((student) => {
          nextActions[student.id] = student.locked
            ? "skip"
            : "promote";
        });

        if (group.suggestedDestinationId) {
          nextDestinations[group.classId] =
            group.suggestedDestinationId;
        }
      });

      setFromYear(data.fromAcademicYear);
      setToYear(data.toAcademicYear);
      setDefaultYear(data.defaultFromAcademicYear);
      setGroups(data.groups);
      setActions(nextActions);
      setDestinations(nextDestinations);
      setExpanded(new Set());
      setStep("select");
      setPlan(null);
      setConfirmed(false);
    } catch (error) {
      setLoadError(
        requestMessage(error, "Data kenaikan siswa gagal dimuat."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    setLevelFilter("");
    setMajorFilter("");
    setPreviewError("");
    setSubmitError("");

    void loadGroups();
  }, [open, loadGroups]);

  const busy = loading || previewing || submitting;

  // Mengunci scroll halaman utama ketika modal terbuka.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onClose]);

  const yearOptions = useMemo(() => {
    const base = defaultYear
      ? yearStart(defaultYear)
      : new Date().getFullYear();

    const years = new Set<string>();

    for (let year = base - 2; year <= base + 1; year += 1) {
      years.add(`${year}/${year + 1}`);
    }

    if (fromYear) years.add(fromYear);

    return [...years].sort();
  }, [defaultYear, fromYear]);

  const majorOptions = useMemo(() => {
    const map = new Map<string, string>();

    groups.forEach((group) => {
      if (group.jurusanId && group.jurusanName) {
        map.set(group.jurusanId, group.jurusanName);
      }
    });

    return [...map.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "id"),
    );
  }, [groups]);

  const visibleGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          (!levelFilter || group.level === levelFilter) &&
          (!majorFilter || group.jurusanId === majorFilter),
      ),
    [groups, levelFilter, majorFilter],
  );

  const visibleStudentCount = visibleGroups.reduce(
    (sum, group) => sum + group.students.length,
    0,
  );

  const effectiveCount = visibleGroups.reduce(
    (sum, group) =>
      sum +
      group.students.filter(
        (student) =>
          !student.locked && actions[student.id] !== "skip",
      ).length,
    0,
  );

  function setGroupAction(
    group: PromotionGroup,
    action: PromotionAction,
  ) {
    setActions((current) => {
      const next = { ...current };

      group.students.forEach((student) => {
        if (!student.locked) {
          next[student.id] = action;
        }
      });

      return next;
    });
  }

  function setAllVisible(action: PromotionAction) {
    setActions((current) => {
      const next = { ...current };

      visibleGroups.forEach((group) => {
        group.students.forEach((student) => {
          if (!student.locked) {
            next[student.id] = action;
          }
        });
      });

      return next;
    });
  }

  function toggleExpanded(classId: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }

      return next;
    });
  }

  function buildPayload() {
    const items = visibleGroups.flatMap((group) =>
      group.students.map((student) => ({
        studentId: student.id,
        action: student.locked
          ? "skip"
          : (actions[student.id] ?? "skip"),
      })),
    );

    const destinationMap: Record<string, string> = {};

    visibleGroups.forEach((group) => {
      if (destinations[group.classId]) {
        destinationMap[group.classId] =
          destinations[group.classId];
      }
    });

    return {
      fromAcademicYear: fromYear,
      items,
      destinations: destinationMap,
    };
  }

  async function handlePreview() {
    if (previewing || effectiveCount === 0) return;

    setPreviewing(true);
    setPreviewError("");

    try {
      const response = await api.post<PreviewResponse>(
        "/promotions/preview",
        buildPayload(),
      );

      setPlan(response.data);
      setConfirmed(false);
      setSubmitError("");
      setStep("preview");
    } catch (error) {
      setPreviewError(
        requestMessage(error, "Preview kenaikan gagal dibuat."),
      );
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirm() {
    if (!plan?.valid || !confirmed || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await api.post<{
        summary: {
          promote: number;
          stay: number;
          alumni: number;
        };
      }>("/promotions", buildPayload());

      const summary = response.data.summary;

      onCompleted(
        `Kenaikan siswa ${fromYear} → ${toYear} berhasil diproses: ${summary.promote} naik kelas, ${summary.stay} tinggal kelas, ${summary.alumni} calon alumni.`,
      );
    } catch (error) {
      setSubmitError(
        requestMessage(error, "Gagal memproses kenaikan siswa."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 grid place-items-center overflow-hidden bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        className="relative flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#263449] dark:bg-[#111c2e]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-[#263449] sm:px-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300">
              <TrendingUp className="h-5 w-5" />
            </span>

            <div>
              <h2
                id="promotion-title"
                className="text-lg font-semibold text-gray-900 dark:text-slate-100"
              >
                Kenaikan Siswa
              </h2>

              <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                {step === "select"
                  ? "Atur siswa yang naik kelas, tinggal kelas, atau tidak diproses."
                  : "Periksa preview perubahan sebelum dikonfirmasi."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup"
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#1b2a3d] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 scrollbar-none [&::-webkit-scrollbar]:hidden sm:px-6">
          {loadError && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
            >
              {loadError}
            </div>
          )}

          {step === "select" && (
            <>
              {/* ACADEMIC YEAR */}
              <div className="mb-4 grid grid-cols-1 items-end gap-3 rounded-xl border border-gray-200 p-4 dark:border-[#263449] md:grid-cols-[1fr_auto_1fr]">
                <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
                  Tahun ajaran saat ini

                  <select
                    value={fromYear}
                    disabled={loading}
                    onChange={(event) =>
                      void loadGroups(event.target.value)
                    }
                    className={`${selectClass} mt-1 w-full font-normal text-gray-900 dark:text-slate-100`}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <ArrowRight className="mx-auto hidden h-5 w-5 text-teal-600 md:block" />

                <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
                  Tahun ajaran tujuan

                  <input
                    readOnly
                    value={toYear}
                    className={`${selectClass} mt-1 w-full cursor-not-allowed bg-gray-50 font-semibold text-gray-700 dark:bg-[#1b2a3d] dark:text-slate-100`}
                  />
                </label>
              </div>

              {/* INFORMATION */}
              <p className="mb-4 rounded-lg bg-teal-50 px-4 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                Kelas X naik ke XI dan kelas XI naik ke XII pada kelas
                tujuan tahun ajaran {toYear || "baru"}. Siswa kelas XII
                diproses sebagai calon alumni (status menjadi Lulus).
                Kelas lama setiap siswa disimpan sebagai riwayat, dan
                siswa yang sudah diproses pada tahun ajaran ini tidak
                dapat diproses lagi.
              </p>

              {/* FILTERS */}
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  aria-label="Filter tingkat"
                  value={levelFilter}
                  onChange={(event) =>
                    setLevelFilter(event.target.value)
                  }
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
                  onChange={(event) =>
                    setMajorFilter(event.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">Semua jurusan</option>

                  {majorOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Atur semua siswa yang tampil"
                  value=""
                  onChange={(event) => {
                    if (event.target.value) {
                      setAllVisible(
                        event.target.value as PromotionAction,
                      );
                    }
                  }}
                  className={`${selectClass} lg:col-span-2`}
                >
                  <option value="">
                    Atur semua siswa yang tampil...
                  </option>
                  <option value="promote">
                    Naik kelas / calon alumni
                  </option>
                  <option value="stay">Tinggal kelas</option>
                  <option value="skip">Tidak diproses</option>
                </select>
              </div>

              {/* STUDENT SUMMARY */}
              <p className="mb-3 text-sm text-gray-500 dark:text-[#a7b4c7]">
                {visibleGroups.length} kelas • {visibleStudentCount}{" "}
                siswa aktif dalam filter • {effectiveCount} akan
                diproses
              </p>

              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Memuat data siswa...
                </div>
              ) : visibleGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-[#263449] dark:text-[#a7b4c7]">
                  Tidak ada siswa aktif yang dapat diproses
                  {groups.length ? " pada filter ini." : "."}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleGroups.map((group) => {
                    const unlocked = group.students.filter(
                      (student) => !student.locked,
                    );

                    const count = (action: PromotionAction) =>
                      unlocked.filter(
                        (student) =>
                          actions[student.id] === action,
                      ).length;

                    const lockedCount =
                      group.students.length - unlocked.length;

                    const isOpen = expanded.has(group.classId);

                    const needsDestination =
                      group.nextLevel !== null &&
                      count("promote") > 0;

                    const missingDestination =
                      needsDestination &&
                      !group.mixedJurusan &&
                      group.destinations.length === 0;

                    return (
                      <div
                        key={group.classId}
                        className="rounded-xl border border-gray-200 dark:border-[#263449]"
                      >
                        {/* GROUP HEADER */}
                        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                {group.className}
                              </h3>

                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                                {group.academicYear}
                              </span>

                              {group.jurusanCode && (
                                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                                  {group.jurusanCode}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500 dark:text-[#a7b4c7]">
                              {group.students.length} siswa • Naik{" "}
                              {count("promote")} • Tinggal{" "}
                              {count("stay")} • Tidak diproses{" "}
                              {count("skip")}
                              {lockedCount > 0 &&
                                ` • ${lockedCount} sudah diproses`}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {group.nextLevel ? (
                              <select
                                aria-label={`Kelas tujuan ${group.className}`}
                                value={
                                  destinations[group.classId] ?? ""
                                }
                                disabled={
                                  group.destinations.length === 0
                                }
                                onChange={(event) =>
                                  setDestinations((current) => ({
                                    ...current,
                                    [group.classId]:
                                      event.target.value,
                                  }))
                                }
                                className={`${selectClass} sm:w-60`}
                              >
                                <option value="">
                                  {group.destinations.length
                                    ? `Pilih kelas tujuan (${group.nextLevel})`
                                    : `Kelas ${group.nextLevel} belum tersedia`}
                                </option>

                                {group.destinations.map(
                                  (destination) => (
                                    <option
                                      key={destination.id}
                                      value={destination.id}
                                    >
                                      {destination.name} (
                                      {destination.academicYear})
                                    </option>
                                  ),
                                )}
                              </select>
                            ) : (
                              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                                Diproses sebagai calon alumni
                              </span>
                            )}

                            <select
                              aria-label={`Atur semua siswa ${group.className}`}
                              value=""
                              onChange={(event) => {
                                if (event.target.value) {
                                  setGroupAction(
                                    group,
                                    event.target
                                      .value as PromotionAction,
                                  );
                                }
                              }}
                              className={`${selectClass} sm:w-48`}
                            >
                              <option value="">
                                Atur semua siswa...
                              </option>

                              <option value="promote">
                                {group.nextLevel
                                  ? `Naik ke ${group.nextLevel}`
                                  : "Calon alumni"}
                              </option>

                              <option value="stay">
                                Tinggal kelas
                              </option>

                              <option value="skip">
                                Tidak diproses
                              </option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                toggleExpanded(group.classId)
                              }
                              aria-expanded={isOpen}
                              aria-label={`${isOpen ? "Sembunyikan" : "Tampilkan"} siswa ${group.className}`}
                              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-[#263449] dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
                            >
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* WARNINGS */}
                        {group.mixedJurusan &&
                          group.nextLevel && (
                            <p className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              Kelas ini berisi siswa dari beberapa
                              jurusan. Lengkapi jurusan kelas di menu
                              Kelas sebelum menaikkan siswa.
                            </p>
                          )}

                        {missingDestination && (
                          <p className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Kelas {group.nextLevel} jurusan{" "}
                            {group.jurusanName || "ini"} untuk tahun
                            ajaran {toYear} belum tersedia. Tambahkan
                            kelas tujuan di halaman Kelas, atau ubah
                            aksi siswa menjadi tinggal kelas / tidak
                            diproses.
                          </p>
                        )}

                        {/* STUDENT TABLE */}
                        {isOpen && (
                          <div className="overflow-x-auto border-t border-gray-200 dark:border-[#263449]">
                            <table className="w-full min-w-150 text-left text-sm">
                              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                                <tr>
                                  <th className="px-4 py-2">No</th>
                                  <th className="px-4 py-2">NIS</th>
                                  <th className="px-4 py-2">Nama</th>
                                  <th className="px-4 py-2">
                                    Angkatan
                                  </th>
                                  <th className="px-4 py-2">Aksi</th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                                {group.students.map(
                                  (student, index) => (
                                    <tr key={student.id}>
                                      <td className="px-4 py-2 text-gray-500 dark:text-[#a7b4c7]">
                                        {index + 1}
                                      </td>

                                      <td className="px-4 py-2">
                                        {student.nis}
                                      </td>

                                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">
                                        {student.name}
                                      </td>

                                      <td className="px-4 py-2 text-gray-600 dark:text-[#a7b4c7]">
                                        {student.generation}
                                      </td>

                                      <td className="px-4 py-2">
                                        {student.locked ? (
                                          <span
                                            title={
                                              student.lockedReason ??
                                              ""
                                            }
                                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#a7b4c7]"
                                          >
                                            <Lock className="h-3.5 w-3.5" />
                                            Sudah diproses
                                          </span>
                                        ) : (
                                          <select
                                            aria-label={`Aksi untuk ${student.name}`}
                                            value={
                                              actions[student.id] ??
                                              "skip"
                                            }
                                            onChange={(event) =>
                                              setActions(
                                                (current) => ({
                                                  ...current,
                                                  [student.id]:
                                                    event.target
                                                      .value as PromotionAction,
                                                }),
                                              )
                                            }
                                            className={`${selectClass} w-44`}
                                          >
                                            <option value="promote">
                                              {group.nextLevel
                                                ? `Naik ke ${group.nextLevel}`
                                                : "Calon alumni"}
                                            </option>

                                            <option value="stay">
                                              Tinggal kelas
                                            </option>

                                            <option value="skip">
                                              Tidak diproses
                                            </option>
                                          </select>
                                        )}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PREVIEW ERROR */}
              {previewError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                >
                  {previewError}
                </p>
              )}
            </>
          )}

          {/* PREVIEW STEP */}
          {step === "preview" && plan && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-[#1b2a3d] dark:text-slate-100">
                  {plan.fromAcademicYear}
                </span>

                <ArrowRight className="h-4 w-4 text-teal-600" />

                <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                  {plan.toAcademicYear}
                </span>
              </div>

              {/* SUMMARY */}
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Naik Kelas", plan.summary.promote],
                  ["Tinggal Kelas", plan.summary.stay],
                  ["Calon Alumni", plan.summary.alumni],
                  ["Tidak Diproses", plan.summary.skip],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-gray-200 p-3 dark:border-[#263449]"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
                      {label}
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* ERRORS */}
              {plan.errors.length > 0 && (
                <div
                  role="alert"
                  className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                >
                  <p className="mb-1 font-semibold">
                    Preview belum dapat dikonfirmasi:
                  </p>

                  <ul className="list-disc space-y-0.5 pl-5">
                    {plan.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* WARNINGS */}
              {plan.warnings.length > 0 && (
                <div
                  role="status"
                  className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  <ul className="list-disc space-y-0.5 pl-5">
                    {plan.warnings.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PREVIEW TABLE */}
              {plan.rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#263449]">
                  <table className="w-full min-w-175 text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                      <tr>
                        <th className="px-4 py-2">No</th>
                        <th className="px-4 py-2">Siswa</th>
                        <th className="px-4 py-2">Kelas Lama</th>
                        <th className="px-4 py-2">Kelas Baru</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Aksi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                      {plan.rows.map((row, index) => (
                        <tr key={row.studentId}>
                          <td className="px-4 py-2 text-gray-500 dark:text-[#a7b4c7]">
                            {index + 1}
                          </td>

                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 dark:text-slate-100">
                              {row.name}
                            </div>

                            <div className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                              NIS: {row.nis}
                            </div>
                          </td>

                          <td className="px-4 py-2 text-gray-600 dark:text-[#a7b4c7]">
                            {row.fromClassName}
                          </td>

                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">
                            {row.toLevel === "Alumni"
                              ? `${row.toClassName} (Alumni)`
                              : row.toClassName}
                          </td>

                          <td className="px-4 py-2 text-gray-600 dark:text-[#a7b4c7]">
                            {row.fromStatus === row.toStatus
                              ? row.toStatus
                              : `${row.fromStatus} → ${row.toStatus}`}
                          </td>

                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadge(row.action)}`}
                            >
                              {row.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUBMIT ERROR */}
              {submitError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                >
                  {submitError}
                </p>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-[#263449] dark:bg-[#111c2e] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {step === "preview" && plan?.valid ? (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600 dark:text-[#a7b4c7]">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
                className="mt-0.5"
              />

              Saya sudah memeriksa preview dan ingin menerapkan
              perubahan ini.
            </label>
          ) : (
            <span />
          )}

          <div className="flex justify-end gap-2">
            {step === "select" ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1b2a3d] dark:text-[#a7b4c7] dark:hover:bg-[#263449]"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => void handlePreview()}
                  disabled={busy || effectiveCount === 0}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {previewing && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}

                  {previewing
                    ? "Memuat preview..."
                    : "Lihat Preview"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep("select");
                    setSubmitError("");
                  }}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1b2a3d] dark:text-[#a7b4c7] dark:hover:bg-[#263449]"
                >
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={
                    !plan?.valid || !confirmed || submitting
                  }
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}

                  {submitting
                    ? "Memproses..."
                    : "Konfirmasi Kenaikan"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PromotionModal;
