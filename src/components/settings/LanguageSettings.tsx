import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";
import Select from "./Select";
import { useLanguage } from "../../context/LanguageContext";

function LanguageSettings() {
  const { settings, updateLanguage, t } = useLanguage();
  return (
    <div className="space-y-5">
      <SettingSection title={t("language")} description={t("settingsLanguageHint")}>
        <SettingRow title={t("appLanguage")}>
          <Select value={settings.language} onChange={(event) => updateLanguage({ language: event.target.value as "id" | "en" })}>
            <option value="id">{t("indonesia")}</option>
            <option value="en">{t("english")}</option>
          </Select>
        </SettingRow>
      </SettingSection>
      <SettingSection title={t("language")} description={t("languageDescription")}>
        <SettingRow title={t("timeZone")}>
          <Select value={settings.timeZone} onChange={(event) => updateLanguage({ timeZone: event.target.value as typeof settings.timeZone })}>
            <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
            <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
            <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            <option value="UTC">UTC</option>
          </Select>
        </SettingRow>
        <SettingRow title={t("dateFormat")}>
          <Select value={settings.dateFormat} onChange={(event) => updateLanguage({ dateFormat: event.target.value as typeof settings.dateFormat })}>
            <option value="numeric">{t("numericDate")}</option>
            <option value="short">{t("shortDate")}</option>
            <option value="long">{t("longDate")}</option>
          </Select>
        </SettingRow>
        <SettingRow title={t("numberFormat")}>
          <Select value={settings.numberFormat} onChange={(event) => updateLanguage({ numberFormat: event.target.value as typeof settings.numberFormat })}>
            <option value="id">{t("indonesianNumber")}</option>
            <option value="en">{t("englishNumber")}</option>
          </Select>
        </SettingRow>
        <SettingRow title={t("currency")}>
          <Select value={settings.currency} onChange={(event) => updateLanguage({ currency: event.target.value as typeof settings.currency })}>
            <option value="IDR">{t("rupiah")}</option>
            <option value="USD">{t("usDollar")}</option>
          </Select>
        </SettingRow>
        <SettingRow title={t("hourCycle")}>
          <Select value={settings.hourCycle} onChange={(event) => updateLanguage({ hourCycle: event.target.value as typeof settings.hourCycle })}>
            <option value="24">{t("hour24")}</option>
            <option value="12">{t("hour12")}</option>
          </Select>
        </SettingRow>
        <SettingRow title={t("weekStart")}>
          <Select value={settings.weekStart} onChange={(event) => updateLanguage({ weekStart: event.target.value as typeof settings.weekStart })}>
            <option value="monday">{t("monday")}</option>
            <option value="sunday">{t("sunday")}</option>
          </Select>
        </SettingRow>
      </SettingSection>
      <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">{t("languageSaved")}</p>
    </div>
  );
}

export default LanguageSettings;
