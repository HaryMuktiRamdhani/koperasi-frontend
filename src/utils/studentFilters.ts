export type StudentSortKey = "name" | "nis" | "class" | "generation";
export type SortDirection = "asc" | "desc";

export interface StudentFilterState {
  search: string;
  jurusanId: string;
  classId: string;
  generation: string;
  status: string;
  sort: StudentSortKey;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export const DEFAULT_STUDENT_FILTERS: StudentFilterState = {
  search: "",
  jurusanId: "",
  classId: "",
  generation: "",
  status: "",
  sort: "name",
  direction: "asc",
  page: 1,
  pageSize: 10,
};

export function normaliseStudentFilters(params: URLSearchParams): StudentFilterState {
  const pageSize = [10, 25, 50].includes(Number(params.get("pageSize")))
    ? Number(params.get("pageSize"))
    : DEFAULT_STUDENT_FILTERS.pageSize;
  const sort = ["name", "nis", "class", "generation"].includes(params.get("sort") || "")
    ? (params.get("sort") as StudentSortKey)
    : DEFAULT_STUDENT_FILTERS.sort;

  return {
    search: params.get("q") || "",
    jurusanId: params.get("jurusan") || "",
    classId: params.get("kelas") || "",
    generation: params.get("angkatan") || "",
    status: params.get("status") || "",
    sort,
    direction: params.get("direction") === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize,
  };
}

export function studentFiltersToParams(filters: StudentFilterState) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.jurusanId) params.set("jurusan", filters.jurusanId);
  if (filters.classId) params.set("kelas", filters.classId);
  if (filters.generation) params.set("angkatan", filters.generation);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.direction !== "asc") params.set("direction", filters.direction);
  if (filters.page !== 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 10) params.set("pageSize", String(filters.pageSize));
  return params;
}

export function toggleStudentSort(
  filters: StudentFilterState,
  sort: StudentSortKey,
): Pick<StudentFilterState, "sort" | "direction"> {
  return {
    sort,
    direction: filters.sort === sort && filters.direction === "asc" ? "desc" : "asc",
  };
}
