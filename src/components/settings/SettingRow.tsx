import type { ReactNode } from "react";

interface SettingRowProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 py-4 last:border-b-0 dark:border-[#263449] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#102a43] dark:text-slate-100">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export default SettingRow;
