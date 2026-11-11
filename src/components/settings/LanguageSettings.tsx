import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";
import Select from "./Select";
import { useLanguage } from "../../context/LanguageContext";

function LanguageSettings() {
  const { settings, updateLanguage, t } = useLanguage();

  return (
    <div className="space-y-5">
      <SettingSection
        title={t("language")}
        description={t("settingsLanguageHint")}
      >
        <SettingRow title={t("appLanguage")}>
          <Select
            value={settings.language}
            onChange={(event) =>
              updateLanguage({ language: event.target.value as "id" | "en" })
            }
          >
            <option value="id">{t("indonesia")}</option>
            <option value="en">{t("english")}</option>
          </Select>
        </SettingRow>
      </SettingSection>
      <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">
        {t("languageSaved")}
      </p>
    </div>
  );
}

export default LanguageSettings;
