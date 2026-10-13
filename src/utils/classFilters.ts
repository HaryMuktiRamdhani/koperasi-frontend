export type ClassSortKey = "name" | "level" | "academicYear" | "studentCount";
export type SortDirection = "asc" | "desc";

export interface ClassFilterState {
  level: string;
  search: string;
  jurusanId: string;
  startYear: string;
  status: string;
  occupancy: string;
  sort: ClassSortKey;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export const DEFAULT_CLASS_FILTERS: ClassFilterState = {
  level: "",
  search: "",
  jurusanId: "",
  startYear: "",
  status: "",
  occupancy: "",
  sort: "name",
  direction: "asc",
  page: 1,
  pageSize: 10,
};

export function normaliseClassFilters(params: URLSearchParams): ClassFilterState {
  const pageSize = [10, 25, 50].includes(Number(params.get("pageSize")))
    ? Number(params.get("pageSize"))
    : 10;
  const sort = ["name", "level", "academicYear", "studentCount"].includes(params.get("sort") || "")
    ? (params.get("sort") as ClassSortKey)
    : "name";

  return {
    level: params.get("tingkat") || "",
    search: params.get("q") || "",
    jurusanId: params.get("jurusan") || "",
    startYear: params.get("tahunMasuk") || "",
    status: params.get("status") || "",
    occupancy: params.get("siswa") || "",
    sort,
    direction: params.get("direction") === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize,
  };
}

export function classFiltersToParams(filters: ClassFilterState) {
  const params = new URLSearchParams();
  if (filters.level) params.set("tingkat", filters.level);
  if (filters.search) params.set("q", filters.search);
  if (filters.jurusanId) params.set("jurusan", filters.jurusanId);
  if (filters.startYear) params.set("tahunMasuk", filters.startYear);
  if (filters.status) params.set("status", filters.status);
  if (filters.occupancy) params.set("siswa", filters.occupancy);
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.direction !== "asc") params.set("direction", filters.direction);
  if (filters.page !== 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 10) params.set("pageSize", String(filters.pageSize));
  return params;
}

export function toggleClassSort(filters: ClassFilterState, sort: ClassSortKey) {
  return {
    sort,
    direction: filters.sort === sort && filters.direction === "asc" ? "desc" as const : "asc" as const,
  };
}
