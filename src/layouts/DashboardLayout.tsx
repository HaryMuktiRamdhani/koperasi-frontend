import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  School,
  Search,
  Settings,
  UserRound,
  Users,
  Wallet,
  X,
  LoaderCircle,
  CircleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar, { menuItems } from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import SessionTimeoutMonitor from "../components/SessionTimeoutMonitor";

interface AuthUser {
  name?: string;
  email?: string;
  role?: string;
}

interface SearchResult {
  id: string;
  label: string;
  detail: string;
  category: string;
  path: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  detail: string;
  path: string;
  createdAt: string;
}

// Warna aksen mengikuti pengaturan tampilan (Settings > Appearance).
const ACCENT = "var(--accent-color, #20b2aa)";

// Ikon kecil untuk setiap kategori hasil pencarian.
const categoryIcons: Record<string, LucideIcon> = {
  Menu: LayoutDashboard,
  Siswa: Users,
  Kelas: School,
  Jurusan: GraduationCap,
  Barang: Package,
  Tagihan: ReceiptText,
  Pembayaran: Wallet,
};

const iconButtonClass =
  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-(--app-border) bg-(--app-surface) text-(--app-muted) hover:border-(--app-primary) hover:text-(--app-primary)";

const panelClass =
  "absolute right-0 top-13 z-30 rounded-2xl border border-(--app-border) bg-(--app-surface) shadow-2xl shadow-slate-900/10 dark:shadow-black/40";

const profileItemClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-(--app-muted) hover:bg-(--app-primary-soft) hover:text-(--app-primary)";

function getStoredUser(): AuthUser {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(storedUser);
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }

  const user = parsed as Record<string, unknown>;

  return {
    name: typeof user.name === "string" ? user.name : undefined,
    email: typeof user.email === "string" ? user.email : undefined,
    role: typeof user.role === "string" ? user.role : undefined,
  };
}

function formatRole(role?: string) {
  if (!role) {
    return "Pengguna";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || "KS";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function DashboardLayout() {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlightedResult, setHighlightedResult] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const user = getStoredUser();

  const currentPage =
    menuItems.find((item) => item.to === location.pathname)?.label ||
    (location.pathname.startsWith("/settings")
      ? t("settings")
      : {
          "/profile": t("profile"),
          "/help": "Help & Support",
        }[location.pathname] || t("dashboard"));
  const visibleMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) => !("adminOnly" in item) || user.role === "admin",
      ),
    [user.role],
  );
  const matchingPages = useMemo(
    () =>
      visibleMenuItems.filter((item) =>
        `${item.label} ${item.to}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [search, visibleMenuItems],
  );
  const combinedResults = useMemo(
    () => [
      ...matchingPages.map((item) => ({
        id: `page-${item.to}`,
        label: item.label,
        detail: "Navigasi halaman",
        category: "Menu",
        path: item.to,
      })),
      ...searchResults.map((item) => ({
        ...item,
        // Hasil siswa langsung membuka halaman detail siswa berdasarkan ID,
        // memakai route yang sama dengan tombol Detail di halaman Siswa.
        path: item.category === "Siswa" ? `/students/${item.id}` : item.path,
      })),
    ],
    [matchingPages, searchResults],
  );

  useEffect(() => {
    setHighlightedResult(0);
  }, [search]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await api.get<SearchResult[]>("/search", {
          params: { q: search.trim() },
        });
        if (!cancelled) setSearchResults(response.data);
      } catch {
        if (!cancelled) setSearchError("Pencarian data gagal dimuat.");
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (!notificationsOpen) return;

    let cancelled = false;
    async function loadNotifications() {
      setNotificationsLoading(true);
      setNotificationsError("");
      try {
        const response = await api.get<{ items: NotificationItem[] }>(
          "/notifications",
        );
        if (!cancelled) setNotifications(response.data.items);
      } catch {
        if (!cancelled) setNotificationsError("Notifikasi gagal dimuat.");
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [notificationsOpen]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;

      if (!profileRef.current?.contains(target)) {
        setProfileOpen(false);
      }

      if (!notificationRef.current?.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setSearch("");
        searchRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function goToPage(path: string) {
    navigate(path);
    setSearch("");
    setHighlightedResult(0);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstMatch = combinedResults[0];

    if (firstMatch) {
      goToPage(firstMatch.path);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && combinedResults.length > 0) {
      event.preventDefault();
      setHighlightedResult((current) => (current + 1) % combinedResults.length);
    }

    if (event.key === "ArrowUp" && combinedResults.length > 0) {
      event.preventDefault();
      setHighlightedResult(
        (current) =>
          (current - 1 + combinedResults.length) % combinedResults.length,
      );
    }

    if (event.key === "Enter" && combinedResults.length > 0) {
      event.preventDefault();
      goToPage(combinedResults[highlightedResult].path);
    }

    if (event.key === "Escape") {
      setSearch("");
      searchRef.current?.blur();
    }
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  }

  return (
    <div className="app-root flex h-screen overflow-hidden bg-[#f5f7fa] dark:bg-[#0b1220]">
      <SessionTimeoutMonitor />
      <Sidebar />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-(--app-border) bg-(--app-surface)/85 px-5 py-3 text-(--app-text) backdrop-blur-md lg:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
            style={{
              backgroundImage: `linear-gradient(90deg, ${ACCENT}, #3b82f6 60%, transparent)`,
            }}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="hidden h-10 w-1 shrink-0 rounded-full sm:block"
                style={{
                  backgroundImage: `linear-gradient(180deg, ${ACCENT}, #3b82f6)`,
                }}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--app-primary)">
                  Stokpedia
                </p>
                {appearance.showBreadcrumb && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs text-(--app-muted)">
                      Administrasi
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-(--app-muted)"
                    />
                    <h1 className="truncate text-lg font-semibold tracking-tight text-(--app-text)">
                      {currentPage}
                    </h1>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {appearance.showSearch && (
                <form
                  className="relative hidden md:block"
                  onSubmit={handleSearchSubmit}
                >
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--app-primary)" />
                  <input
                    ref={searchRef}
                    aria-label="Cari halaman"
                    aria-controls="global-search-results"
                    aria-expanded={Boolean(search)}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={t("search")}
                    className="w-56 rounded-xl border border-(--app-border) bg-(--app-surface-muted) py-2.5 pl-10 pr-3 text-sm text-(--app-text) outline-none placeholder:text-(--app-muted) focus:bg-(--app-surface) lg:w-72"
                  />
                  {search && (
                    <div
                      id="global-search-results"
                      role="listbox"
                      className="absolute right-0 top-13 z-30 w-[min(26rem,90vw)] overflow-hidden rounded-2xl border border-(--app-border) bg-(--app-surface) py-1.5 shadow-2xl shadow-slate-900/10 dark:shadow-black/40"
                    >
                      {searchLoading ? (
                        <div className="flex items-center gap-2 px-4 py-5 text-sm text-(--app-muted)">
                          <LoaderCircle className="h-4 w-4 text-(--app-primary)" />{" "}
                          Mencari data...
                        </div>
                      ) : searchError ? (
                        <div className="px-4 py-5 text-center text-sm text-red-600">
                          {searchError}
                        </div>
                      ) : combinedResults.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto px-1.5">
                          {combinedResults.map((item, index) => {
                            const ResultIcon =
                              categoryIcons[item.category] || Search;
                            const active = index === highlightedResult;

                            return (
                              <button
                                key={`${item.category}-${item.id}`}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onMouseEnter={() => setHighlightedResult(index)}
                                onClick={() => goToPage(item.path)}
                                className={[
                                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm",
                                  active
                                    ? "bg-(--app-primary-soft) text-(--app-text)"
                                    : "text-(--app-muted) hover:bg-(--app-surface-muted)",
                                ].join(" ")}
                              >
                                <span
                                  className={[
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                    active
                                      ? "bg-(--app-primary) text-white"
                                      : "bg-(--app-surface-muted) text-(--app-primary)",
                                  ].join(" ")}
                                >
                                  <ResultIcon
                                    className="h-4 w-4"
                                    strokeWidth={1.9}
                                  />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium text-(--app-text)">
                                    {item.label}
                                  </span>
                                  <span className="block truncate text-xs text-(--app-muted)">
                                    <span className="font-semibold text-(--app-primary)">
                                      {item.category}
                                    </span>
                                    {" · "}
                                    {item.detail}
                                  </span>
                                </span>
                                {active && (
                                  <CornerDownLeft
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0 text-(--app-primary)"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm font-medium text-(--app-text)">
                            Tidak ada halaman ditemukan
                          </p>
                          <p className="mt-1 text-xs text-(--app-muted)">
                            Coba kata kunci lain.
                          </p>
                        </div>
                      )}
                      <p className="mt-1 border-t border-(--app-border) bg-(--app-surface-muted) px-4 py-2 text-[11px] text-(--app-muted)">
                        Gunakan ↑ ↓ untuk memilih, Enter untuk membuka, Esc
                        untuk menutup
                      </p>
                    </div>
                  )}
                </form>
              )}

              <div ref={notificationRef} className="relative">
                {user.role === "admin" && (
                  <button
                    type="button"
                    aria-label="Notifikasi"
                    aria-expanded={notificationsOpen}
                    onClick={() => {
                      setNotificationsOpen((open) => !open);
                      setProfileOpen(false);
                    }}
                    className={[
                      iconButtonClass,
                      notificationsOpen
                        ? "border-(--app-primary) bg-(--app-primary-soft) text-(--app-primary)"
                        : "",
                    ].join(" ")}
                  >
                    <Bell className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                )}
                {notificationsOpen && (
                  <div className={`${panelClass} w-[min(22rem,90vw)] p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--app-primary-soft) text-(--app-primary)">
                          <Bell className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold text-(--app-text)">
                            Notifikasi
                          </h2>
                          <p className="text-xs text-(--app-muted)">
                            Informasi dan aktivitas akun
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Tutup notifikasi"
                        onClick={() => setNotificationsOpen(false)}
                        className="cursor-pointer rounded-lg p-1.5 text-(--app-muted) hover:bg-(--app-surface-muted) hover:text-(--app-text)"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-(--app-muted)">
                        <LoaderCircle className="h-4 w-4 text-(--app-primary)" />{" "}
                        Memuat notifikasi...
                      </div>
                    ) : notificationsError ? (
                      <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        <CircleAlert className="h-4 w-4 shrink-0" />{" "}
                        {notificationsError}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-(--app-border) px-3 py-6 text-center">
                        <Bell
                          className="mx-auto h-5 w-5 text-(--app-muted)"
                          strokeWidth={1.7}
                        />
                        <p className="mt-2 text-sm font-medium text-(--app-text)">
                          Belum ada notifikasi
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-(--app-muted)">
                          Belum ada aktivitas operasional untuk ditampilkan.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              goToPage(notification.path);
                              setNotificationsOpen(false);
                            }}
                            className="w-full cursor-pointer rounded-xl border border-(--app-border) border-l-4 border-l-(--app-primary) bg-(--app-surface-muted) p-3 text-left hover:bg-(--app-primary-soft)"
                          >
                            <p className="text-xs font-semibold text-(--app-text)">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-(--app-muted)">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs font-medium text-(--app-primary)">
                              {notification.detail}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setProfileOpen(false);
                    }
                  }}
                  aria-expanded={profileOpen}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-(--app-border) bg-(--app-surface) py-1.5 pl-1.5 pr-2.5 hover:border-(--app-primary)"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${ACCENT}, #0e7490)`,
                    }}
                  >
                    {getInitials(user.name, user.email)}
                  </span>
                  <span className="hidden max-w-44 text-left sm:block">
                    <span className="block truncate text-sm font-semibold leading-tight text-(--app-text)">
                      {user.name || user.email || "Pengguna"}
                    </span>
                    <span className="block text-xs text-(--app-muted)">
                      {formatRole(user.role)}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-(--app-muted) sm:block" />
                </button>

                {profileOpen && (
                  <div className={`${panelClass} w-72 overflow-hidden`}>
                    <div
                      className="flex items-center gap-3 px-4 py-4"
                      style={{
                        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 16%, transparent), transparent 70%)`,
                      }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${ACCENT}, #0e7490)`,
                        }}
                      >
                        {getInitials(user.name, user.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-(--app-text)">
                          {user.name || "Pengguna"}
                        </p>
                        <p className="truncate text-xs text-(--app-muted)">
                          {user.email || "Email tidak tersedia"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-y border-(--app-border) px-4 py-2.5 text-xs text-(--app-muted)">
                      <UserRound
                        className="h-4 w-4 text-(--app-primary)"
                        strokeWidth={1.8}
                      />
                      <span>Role: {formatRole(user.role)}</span>
                    </div>
                    <div className="space-y-0.5 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/settings/profile");
                          setProfileOpen(false);
                        }}
                        className={profileItemClass}
                      >
                        <UserRound className="h-4 w-4" strokeWidth={1.8} />
                        Profile
                      </button>
                      {user.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate("/settings");
                            setProfileOpen(false);
                          }}
                          className={profileItemClass}
                        >
                          <Settings className="h-4 w-4" strokeWidth={1.8} />
                          Settings
                        </button>
                      )}
                    </div>
                    <div className="border-t border-(--app-border) p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-(--app-muted) hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.8} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          className={`min-w-0 p-5 lg:p-8 ${appearance.contentWidth === "centered" ? "mx-auto w-full max-w-7xl" : ""} ${appearance.density === "compact" ? "text-sm" : appearance.density === "dense" ? "text-xs" : ""}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;