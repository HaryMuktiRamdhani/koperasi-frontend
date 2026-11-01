import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <span className="mt-0.5 rounded-lg bg-[#e8f7f5] p-2 text-[#168b87] dark:bg-[#164e63] dark:text-[#5eead4]">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>}
      </div>
    </div>
  );
}

export default PageHeader;
