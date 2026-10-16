import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Bell, ChevronDown, Search, UserRound, X, LoaderCircle, CircleAlert } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar, { menuItems } from "../components/Sidebar";
import api from "../services/api";

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
    ({
      "/profile": "Profile",
      "/settings": "Settings",
      "/help": "Help & Support",
    }[location.pathname] || "Dashboard");
  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => !("adminOnly" in item) || user.role === "admin"),
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
      ...searchResults,
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
        const response = await api.get<{ items: NotificationItem[] }>("/notifications");
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
        (current) => (current - 1 + combinedResults.length) % combinedResults.length,
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fa]">
      <Sidebar />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-(--app-border) bg-(--app-surface)/95 px-5 py-4 text-(--app-text) backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#168b87]">
                KOPERASI SEKOLAH
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-(--app-text-secondary)">Administrasi</span>
                <span className="text-(--app-border)">/</span>
                <h1 className="truncate text-base font-semibold text-(--app-text)">{currentPage}</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <form className="relative hidden md:block" onSubmit={handleSearchSubmit}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--app-text-secondary)" />
                <input
                  ref={searchRef}
                  aria-label="Cari halaman"
                  aria-controls="global-search-results"
                  aria-expanded={Boolean(search)}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari menu..."
                  className="w-48 rounded-lg border border-(--app-border) bg-(--app-surface-secondary) py-2 pl-9 pr-3 text-sm text-(--app-text) outline-none transition focus:border-[#20b2aa] focus:bg-(--app-surface) focus:ring-2 focus:ring-[#20b2aa]/15 lg:w-60"
                />
                {search && (
                  <div
                    id="global-search-results"
                    role="listbox"
                    className="absolute left-0 right-0 top-11 overflow-hidden rounded-lg border border-(--app-border) bg-(--app-surface) py-1 shadow-lg"
                  >
                    {searchLoading ? (
                      <div className="flex items-center gap-2 px-3 py-4 text-sm text-(--app-text-secondary)">
                        <LoaderCircle className="h-4 w-4 animate-spin text-[#168b87]" /> Mencari data...
                      </div>
                    ) : searchError ? (
                      <div className="px-3 py-4 text-center text-sm text-red-600">{searchError}</div>
                    ) : combinedResults.length > 0 ? combinedResults.map((item, index) => (
                      <button
                        key={`${item.category}-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={index === highlightedResult}
                        onMouseEnter={() => setHighlightedResult(index)}
                        onClick={() => goToPage(item.path)}
                        className={[
                          "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm",
                          index === highlightedResult
                            ? "bg-[#e8f7f5] text-(--app-text)"
                            : "text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)",
                        ].join(" ")}
                      >
                        <Search className="h-4 w-4 text-[#168b87]" strokeWidth={1.8} />
                        <span className="min-w-0">
                          <span className="block font-medium">{item.label}</span>
                          <span className="block text-xs text-(--app-text-secondary)">{item.category} · {item.detail}</span>
                        </span>
                      </button>
                    )) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-sm font-medium text-(--app-text)">Tidak ada halaman ditemukan</p>
                        <p className="mt-1 text-xs text-(--app-text-secondary)">Coba kata kunci lain.</p>
                      </div>
                    )}
                    <p className="border-t border-(--app-border) px-3 py-2 text-[11px] text-(--app-text-secondary)">
                      Gunakan ↑ ↓ untuk memilih, Enter untuk membuka, Esc untuk menutup
                    </p>
                  </div>
                )}
              </form>

              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  aria-label="Notifikasi"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  className={[
                    "cursor-pointer rounded-lg p-2 transition-colors",
                    notificationsOpen
                      ? "bg-[#e8f7f5] text-[#13716d]"
                      : "text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)",
                  ].join(" ")}
                >
                  <Bell className="h-5 w-5" strokeWidth={1.8} />
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-xl border border-(--app-border) bg-(--app-surface) p-4 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-(--app-text)">Notifikasi</h2>
                        <p className="mt-1 text-xs text-(--app-text-secondary)">Informasi dan aktivitas akun</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Tutup notifikasi"
                        onClick={() => setNotificationsOpen(false)}
                        className="cursor-pointer rounded-md p-1 text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-7 text-sm text-(--app-text-secondary)"><LoaderCircle className="h-4 w-4 animate-spin text-[#168b87]" /> Memuat notifikasi...</div>
                    ) : notificationsError ? (
                      <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700"><CircleAlert className="h-4 w-4 shrink-0" /> {notificationsError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-(--app-border) px-3 py-5 text-center">
                        <Bell className="mx-auto h-5 w-5 text-(--app-text-secondary)" strokeWidth={1.7} />
                        <p className="mt-2 text-sm font-medium text-(--app-text-secondary)">Belum ada notifikasi</p>
                        <p className="mt-1 text-xs leading-relaxed text-(--app-text-secondary)">Belum ada aktivitas operasional untuk ditampilkan.</p>
                      </div>
                    ) : (
                      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button key={notification.id} type="button" onClick={() => { goToPage(notification.path); setNotificationsOpen(false); }} className="w-full cursor-pointer rounded-lg border border-(--app-border) p-3 text-left hover:bg-(--app-surface-secondary)">
                            <p className="text-xs font-semibold text-(--app-text)">{notification.title}</p>
                            <p className="mt-1 text-xs text-(--app-text-secondary)">{notification.message}</p>
                            <p className="mt-1 text-xs text-(--app-text-secondary)">{notification.detail}</p>
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
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-(--app-surface-secondary)"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9f3f0] text-xs font-bold text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]">
                    {getInitials(user.name, user.email)}
                  </span>
                  <span className="hidden max-w-32 text-left sm:block">
                    <span className="block truncate text-sm font-semibold text-(--app-text)">
                      {user.name || user.email || "Pengguna"}
                    </span>
                    <span className="block text-xs text-(--app-text-secondary)">{formatRole(user.role)}</span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-(--app-text-secondary) sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-64 rounded-xl border border-(--app-border) bg-(--app-surface) p-3 shadow-lg">
                    <div className="flex items-center gap-3 border-b border-(--app-border) px-2 pb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f3f0] text-sm font-bold text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]">
                        {getInitials(user.name, user.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-(--app-text)">{user.name || "Pengguna"}</p>
                        <p className="truncate text-xs text-(--app-text-secondary)">{user.email || "Email tidak tersedia"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-3 text-xs text-(--app-text-secondary)">
                      <UserRound className="h-4 w-4" />
                      <span>Role: {formatRole(user.role)}</span>
                    </div>
                    <div className="mb-2 space-y-1 border-t border-(--app-border) pt-2">
                      <button type="button" onClick={() => { navigate("/profile"); setProfileOpen(false); }} className="w-full rounded-lg px-2 py-2 text-left text-sm text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)">Profile</button>
                      <button type="button" onClick={() => { navigate("/settings"); setProfileOpen(false); }} className="w-full rounded-lg px-2 py-2 text-left text-sm text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)">Settings</button>
                      <button type="button" onClick={() => { navigate("/help"); setProfileOpen(false); }} className="w-full rounded-lg px-2 py-2 text-left text-sm text-(--app-text-secondary) hover:bg-(--app-surface-secondary) hover:text-(--app-text)">Help &amp; Support</button>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg bg-(--app-surface-secondary) px-3 py-2 text-left text-sm font-medium text-(--app-text) transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;