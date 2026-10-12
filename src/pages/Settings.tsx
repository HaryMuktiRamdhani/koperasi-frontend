import { useEffect, useState } from "react";
import { Check, Moon, SlidersHorizontal, Sun } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";

function Settings() {
  const { theme, setTheme } = useTheme();
  const [compactSidebar, setCompactSidebar] = useState(() => localStorage.getItem("compactSidebar") === "true");

  useEffect(() => {
    localStorage.setItem("compactSidebar", String(compactSidebar));
  }, [compactSidebar]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Preferensi antarmuka yang tersimpan di perangkat ini." icon={SlidersHorizontal} />
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div>
            <h2 className="text-base font-semibold text-[#102a43]">Tema tampilan</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih tema yang digunakan di seluruh aplikasi.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([
              { value: "light" as const, label: "Light Mode", description: "Tampilan terang dengan kontras lembut.", icon: Sun },
              { value: "dark" as const, label: "Dark Mode", description: "Tampilan gelap yang nyaman untuk mata.", icon: Moon },
            ]).map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={selected}
                  className={[
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition cursor-pointer",
                    selected
                      ? "border-[#20b2aa] bg-[#e8f7f5] text-[#102a43]"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#20b2aa] hover:bg-[#f6fbfa]",
                  ].join(" ")}
                >
                  <span className="rounded-lg bg-white p-2 text-[#168b87]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      {option.label}
                      {selected && <Check className="h-4 w-4 text-[#168b87]" />}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-[#102a43]">Mode sidebar ringkas</span>
            <span className="mt-1 block text-sm text-slate-500">Preferensi ini disimpan secara lokal di browser.</span>
          </span>
          <input type="checkbox" checked={compactSidebar} onChange={(event) => setCompactSidebar(event.target.checked)} className="cursor-pointer mt-1 h-5 w-5 accent-[#168b87]" />
        </label>
        </section>
      </div>
    </div>
  );
}

export default Settings;
