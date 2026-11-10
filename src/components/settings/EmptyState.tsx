import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

function EmptyState({ title, description = "Fitur ini akan dikembangkan pada tahap berikutnya.", icon: Icon = Construction }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-[#263449] dark:bg-[#1b2a3d]">
      <div className="max-w-md">
        <Icon className="mx-auto h-7 w-7 text-[#168b87]" strokeWidth={1.8} />
        <h2 className="mt-4 text-base font-semibold text-[#102a43] dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>
      </div>
    </div>
  );
}

export default EmptyState;
