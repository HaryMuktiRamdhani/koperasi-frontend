import type { ReactNode } from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#294254] dark:bg-[#122333] sm:p-7">
      <h2 className="text-base font-semibold text-[#102a43] dark:text-slate-100">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default SettingSection;
