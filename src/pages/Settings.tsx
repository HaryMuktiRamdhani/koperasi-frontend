import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";

function Settings() {
  const [compactSidebar, setCompactSidebar] = useState(() => localStorage.getItem("compactSidebar") === "true");

  useEffect(() => {
    localStorage.setItem("compactSidebar", String(compactSidebar));
  }, [compactSidebar]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Preferensi antarmuka yang tersimpan di perangkat ini." icon={SlidersHorizontal} />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-[#102a43]">Mode sidebar ringkas</span>
            <span className="mt-1 block text-sm text-slate-500">Preferensi ini disimpan secara lokal di browser.</span>
          </span>
          <input type="checkbox" checked={compactSidebar} onChange={(event) => setCompactSidebar(event.target.checked)} className="mt-1 h-5 w-5 accent-[#168b87]" />
        </label>
      </div>
    </div>
  );
}

export default Settings;
