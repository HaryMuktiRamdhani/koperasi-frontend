import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";

const themeOptions = [
  { value: "light" as const, label: "Terang", icon: Sun },
  { value: "dark" as const, label: "Gelap", icon: Moon },
  { value: "system" as const, label: "Sistem", icon: Monitor },
];

function AppearanceSettings() {
  const { appearance, setTheme } = useTheme();

  return (
    <div className="space-y-5">
      <SettingSection
        title="Tema"
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
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    appearance.themeMode === option.value
                      ? "border-[#20b2aa] bg-[#e8f7f5] text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]"
                      : "border-slate-200 text-slate-500 dark:border-[#263449] dark:text-[#a7b4c7]"
                  }`}
                >
                  <Icon
                    className="h-4 w-4 text-slate-500 dark:text-slate-300"
                    strokeWidth={1.8}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </SettingRow>
      </SettingSection>
    </div>
  );
}

export default AppearanceSettings;
