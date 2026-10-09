import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Bell, ChevronDown, Search, UserRound, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar, { menuItems } from "../components/Sidebar";

interface AuthUser {
  name?: string;
  email?: string;
  role?: string;
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
  const [search, setSearch] = useState("");
  const [highlightedResult, setHighlightedResult] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const user = getStoredUser();

  const currentPage =
    menuItems.find((item) => item.to === location.pathname)?.label || "Dashboard";
  const matchingPages = useMemo(
    () =>
      menuItems.filter((item) =>
        `${item.label} ${item.to}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [search],
  );

  useEffect(() => {
    setHighlightedResult(0);
  }, [search]);

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
    const firstMatch = matchingPages[0];

    if (firstMatch) {
      goToPage(firstMatch.to);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matchingPages.length > 0) {
      event.preventDefault();
      setHighlightedResult((current) => (current + 1) % matchingPages.length);
    }

    if (event.key === "ArrowUp" && matchingPages.length > 0) {
      event.preventDefault();
      setHighlightedResult(
        (current) => (current - 1 + matchingPages.length) % matchingPages.length,
      );
    }

    if (event.key === "Enter" && matchingPages.length > 0) {
      event.preventDefault();
      goToPage(matchingPages[highlightedResult].to);
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
    <div className="flex min-h-screen overflow-x-hidden bg-[#f5f7fa]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#168b87]">
                KOPERASI SEKOLAH
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-slate-400">Administrasi</span>
                <span className="text-slate-300">/</span>
                <h1 className="truncate text-base font-semibold text-[#102a43]">{currentPage}</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <form className="relative hidden md:block" onSubmit={handleSearchSubmit}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  aria-label="Cari halaman"
                  aria-controls="global-search-results"
                  aria-expanded={Boolean(search)}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari menu..."
                  className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#20b2aa] focus:bg-white focus:ring-2 focus:ring-[#20b2aa]/15 lg:w-60"
                />
                {search && (
                  <div
                    id="global-search-results"
                    role="listbox"
                    className="absolute left-0 right-0 top-11 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {matchingPages.length > 0 ? matchingPages.map((item, index) => {
                      const Icon = item.icon;

                      return (
                      <button
                        key={item.to}
                        type="button"
                        role="option"
                        aria-selected={index === highlightedResult}
                        onMouseEnter={() => setHighlightedResult(index)}
                        onClick={() => goToPage(item.to)}
                        className={[
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm",
                          index === highlightedResult
                            ? "bg-[#e8f7f5] text-[#102a43]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-[#102a43]",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 text-[#168b87]" strokeWidth={1.8} />
                        <span className="min-w-0">
                          <span className="block font-medium">{item.label}</span>
                          <span className="block text-xs text-slate-400">Navigasi halaman</span>
                        </span>
                      </button>
                      );
                    }) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-sm font-medium text-slate-700">Tidak ada halaman ditemukan</p>
                        <p className="mt-1 text-xs text-slate-400">Coba kata kunci lain.</p>
                      </div>
                    )}
                    <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
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
                    "rounded-lg p-2 transition-colors",
                    notificationsOpen
                      ? "bg-[#e8f7f5] text-[#13716d]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#102a43]",
                  ].join(" ")}
                >
                  <Bell className="h-5 w-5" strokeWidth={1.8} />
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-[#102a43]">Notifikasi</h2>
                        <p className="mt-1 text-xs text-slate-500">Pusat informasi akun</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Tutup notifikasi"
                        onClick={() => setNotificationsOpen(false)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center">
                      <Bell className="mx-auto h-5 w-5 text-slate-300" strokeWidth={1.7} />
                      <p className="mt-2 text-sm font-medium text-slate-600">Belum ada notifikasi</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        Sistem notifikasi belum tersedia dari server.
                      </p>
                    </div>
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
                  className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9f3f0] text-xs font-bold text-[#13716d]">
                    {getInitials(user.name, user.email)}
                  </span>
                  <span className="hidden max-w-32 text-left sm:block">
                    <span className="block truncate text-sm font-semibold text-[#102a43]">
                      {user.name || user.email || "Pengguna"}
                    </span>
                    <span className="block text-xs text-slate-500">{formatRole(user.role)}</span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f3f0] text-sm font-bold text-[#13716d]">
                        {getInitials(user.name, user.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#102a43]">{user.name || "Pengguna"}</p>
                        <p className="truncate text-xs text-slate-500">{user.email || "Email tidak tersedia"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
                      <UserRound className="h-4 w-4" />
                      <span>Role: {formatRole(user.role)}</span>
                    </div>
                    <p className="mb-2 px-2 text-[11px] leading-relaxed text-slate-400">
                      Profil dan pengaturan akun belum tersedia sebagai halaman terpisah.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Keluar dari akun
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