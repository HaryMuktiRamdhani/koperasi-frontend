import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import SettingRow from "./SettingRow";
import SettingSection from "./SettingSection";
import { useCooperative } from "../../context/CooperativeContext";

function CooperativeProfileSettings() {
  const { profile, updateProfile } = useCooperative();
  const [name, setName] = useState(profile.name);
  const [subtitle, setSubtitle] = useState(profile.subtitle);
  const [logo, setLogo] = useState<string | null>(profile.logoUrl);
  const [logoChanged, setLogoChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
    setSubtitle(profile.subtitle);
    if (!logoChanged) setLogo(profile.logoUrl);
  }, [profile, logoChanged]);

  function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Logo harus PNG, JPG, JPEG, atau WEBP dengan ukuran maksimal 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setLogoChanged(true);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function save() {
    setSaving(true);
    setMessage("");
    setError("");
    updateProfile(
      { name: name.trim() || profile.name, subtitle: subtitle.trim() || profile.subtitle },
      logoChanged ? logo : undefined,
    )
      .then(() => {
        setLogoChanged(false);
        setMessage("Identitas koperasi berhasil disimpan.");
      })
      .catch(() => setError("Gagal menyimpan identitas koperasi."))
      .finally(() => setSaving(false));
  }

  return (
    <div className="space-y-5">
      <SettingSection title="Identitas Koperasi" description="Atur nama dan identitas yang tampil pada sidebar aplikasi.">
        <SettingRow title="Logo sekolah" description="PNG, JPG, WEBP, atau SVG dengan ukuran maksimal 2 MB.">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[#168b87] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-[#5eead4]">
              {logo ? <img src={logo} alt="Pratinjau logo sekolah" className="h-full w-full object-contain p-1" /> : <span className="px-2 text-center text-xs text-slate-400">Belum ada logo</span>}
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogo} />
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-[#263449]">
              <ImagePlus className="h-4 w-4" /> {logo ? "Ganti Logo" : "Unggah Logo"}
            </button>
            {logo && <button type="button" onClick={() => { setLogo(null); setLogoChanged(true); }} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-300"><Trash2 className="h-4 w-4" /> Hapus Logo</button>}
          </div>
        </SettingRow>
        <SettingRow title="Nama sekolah">
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" />
        </SettingRow>
        <SettingRow title="Subtitle">
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#20b2aa] dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100" />
        </SettingRow>
        <div className="flex justify-end">
          <button type="button" onClick={save} disabled={saving} className="cursor-pointer rounded-lg bg-[#20b2aa] px-4 py-2 text-sm font-semibold text-[#102a43] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan identitas"}</button>
        </div>
        {message && <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      </SettingSection>
    </div>
  );
}

export default CooperativeProfileSettings;
