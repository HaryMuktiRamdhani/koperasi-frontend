import { useState } from "react";
import { RotateCcw, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import type { AppearanceSettings as AppearanceState } from "../../services/settingsStorage";
import ConfirmDialog from "./ConfirmDialog";
import SegmentedControl from "./SegmentedControl";
import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";
import Toggle from "./Toggle";

const themeOptions = [
  { value: "light" as const, label: "Terang", icon: Sun },
  { value: "dark" as const, label: "Gelap", icon: Moon },
  { value: "system" as const, label: "Sistem", icon: Monitor },
];

function AppearanceSettings() {
  const { appearance, setTheme, updateAppearance, resetAppearance } =
    useTheme();
  const [resetOpen, setResetOpen] = useState(false);

  function update<K extends keyof AppearanceState>(
    key: K,
    value: AppearanceState[K],
  ) {
    updateAppearance({ [key]: value } as Partial<AppearanceState>);
  }

  return (
    <div className="space-y-5">
      <SettingSection
        title="Tema & Warna"
        description="Perubahan diterapkan langsung ke aplikasi."
      >
        <SettingRow
          title="Mode tema"
          description="Pilih tema tetap atau ikuti pengaturan sistem."
        >
          <div className="flex flex-wrap gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${appearance.themeMode === option.value ? "border-[#20b2aa] bg-[#e8f7f5] text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]" : "border-slate-200 text-slate-500 dark:border-[#263449] dark:text-[#a7b4c7]"}`}
                >
                  <Icon
                    className="h-4 w-4 text-slate-500 dark:text-slate-300"
                    strokeWidth={1.8}
                  />{" "}
                  {option.label}
                </button>
              );
            })}
          </div>
        </SettingRow>
        <SettingRow
          title="Warna aksen"
          description="Warna utama tombol dan penanda interaktif."
        >
          <SegmentedControl
            value={appearance.accent}
            onChange={(value) => update("accent", value)}
            options={[
              { value: "teal", label: "Teal" },
              { value: "blue", label: "Biru" },
              { value: "violet", label: "Ungu" },
              { value: "amber", label: "Amber" },
            ]}
          />
        </SettingRow>
        <SettingRow
          title="Mode kontras tinggi"
          description="Perjelas perbedaan warna teks dan permukaan."
        >
          <Toggle
            checked={appearance.highContrast}
            onChange={(value) => update("highContrast", value)}
            label="Mode kontras tinggi"
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Layout"
        description="Atur kepadatan dan elemen navigasi utama."
      >
        <SettingRow title="Sidebar ringkas">
          <Toggle
            checked={appearance.compactSidebar}
            onChange={(value) => update("compactSidebar", value)}
            label="Sidebar ringkas"
          />
        </SettingRow>
        <SettingRow
          title="Sidebar auto-hide"
          description="Sidebar menampilkan label saat diarahkan."
        >
          <Toggle
            checked={appearance.autoHideSidebar}
            onChange={(value) => update("autoHideSidebar", value)}
            label="Sidebar auto-hide"
          />
        </SettingRow>
        <SettingRow title="Tampilkan breadcrumb">
          <Toggle
            checked={appearance.showBreadcrumb}
            onChange={(value) => update("showBreadcrumb", value)}
            label="Tampilkan breadcrumb"
          />
        </SettingRow>
        <SettingRow title="Tampilkan kolom pencarian">
          <Toggle
            checked={appearance.showSearch}
            onChange={(value) => update("showSearch", value)}
            label="Tampilkan pencarian"
          />
        </SettingRow>
        <SettingRow title="Tampilkan kartu Ruang Kerja">
          <Toggle
            checked={appearance.showWorkspaceCard}
            onChange={(value) => update("showWorkspaceCard", value)}
            label="Tampilkan kartu ruang kerja"
          />
        </SettingRow>
        <SettingRow title="Kepadatan tampilan">
          <SegmentedControl
            value={appearance.density}
            onChange={(value) => update("density", value)}
            options={[
              { value: "comfortable", label: "Nyaman" },
              { value: "compact", label: "Ringkas" },
              { value: "dense", label: "Padat" },
            ]}
          />
        </SettingRow>
        <SettingRow title="Lebar konten">
          <SegmentedControl
            value={appearance.contentWidth}
            onChange={(value) => update("contentWidth", value)}
            options={[
              { value: "full", label: "Penuh" },
              { value: "centered", label: "Terpusat" },
            ]}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Teks & Aksesibilitas">
        <SettingRow title="Ukuran font">
          <SegmentedControl
            value={appearance.fontSize}
            onChange={(value) => update("fontSize", value)}
            options={[
              { value: "small", label: "Kecil" },
              { value: "medium", label: "Sedang" },
              { value: "large", label: "Besar" },
            ]}
          />
        </SettingRow>
        <SettingRow title="Jenis font">
          <SegmentedControl
            value={appearance.fontFamily}
            onChange={(value) => update("fontFamily", value)}
            options={[
              { value: "system", label: "Sistem" },
              { value: "monospace", label: "Monospace" },
              { value: "serif", label: "Serif" },
            ]}
          />
        </SettingRow>
        <SettingRow
          title="Fokus outline"
          description="Tampilkan garis fokus yang jelas saat navigasi keyboard."
        >
          <Toggle
            checked={appearance.focusOutline}
            onChange={(value) => update("focusOutline", value)}
            label="Fokus outline"
          />
        </SettingRow>
        <SettingRow title="Sorot tautan">
          <Toggle
            checked={appearance.highlightLinks}
            onChange={(value) => update("highlightLinks", value)}
            label="Sorot tautan"
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Tabel & Data">
        <SettingRow title="Baris tabel belang">
          <Toggle
            checked={appearance.zebraRows}
            onChange={(value) => update("zebraRows", value)}
            label="Baris tabel belang"
          />
        </SettingRow>
        <SettingRow title="Header tabel menempel">
          <Toggle
            checked={appearance.stickyTableHeader}
            onChange={(value) => update("stickyTableHeader", value)}
            label="Header tabel menempel"
          />
        </SettingRow>
        <SettingRow title="Tampilkan nomor urut">
          <Toggle
            checked={appearance.showRowNumbers}
            onChange={(value) => update("showRowNumbers", value)}
            label="Nomor urut"
          />
        </SettingRow>
        <SettingRow title="Jumlah data per halaman">
          <SegmentedControl
            value={String(appearance.defaultPageSize)}
            onChange={(value) => update("defaultPageSize", Number(value))}
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
            ]}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Dashboard"
        description="Widget yang dimatikan tidak akan dirender di Dashboard."
      >
        {(
          [
            ["cashSummary", "Ringkasan kas"],
            ["chart", "Grafik status pembayaran"],
            ["dueBills", "Tagihan jatuh tempo"],
            ["lowStock", "Stok menipis"],
            ["recentActivity", "Aktivitas terbaru"],
          ] as const
        ).map(([key, label]) => (
          <SettingRow key={key} title={label}>
            <Toggle
              checked={appearance.dashboardWidgets[key]}
              onChange={(value) =>
                update("dashboardWidgets", {
                  ...appearance.dashboardWidgets,
                  [key]: value,
                })
              }
              label={label}
            />
          </SettingRow>
        ))}
      </SettingSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300"
        >
          <RotateCcw className="h-4 w-4" /> Reset ke Default
        </button>
      </div>
      <ConfirmDialog
        open={resetOpen}
        title="Reset tampilan?"
        description="Seluruh preferensi tampilan akan dikembalikan ke nilai awal."
        confirmLabel="Reset"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetAppearance();
          setResetOpen(false);
        }}
      >
        <p className="mt-4 text-sm text-slate-500 dark:text-[#a7b4c7]">
          Tema, layout, teks, tabel, dan widget Dashboard akan direset.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default AppearanceSettings;
