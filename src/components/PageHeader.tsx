import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}

function PageHeader({ eyebrow = "Data koperasi", title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-7 flex items-start gap-3">
      {Icon && (
        <span className="mt-0.5 rounded-lg bg-[#e8f7f5] p-2 text-[#168b87]">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#168b87]">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#102a43]">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default PageHeader;
