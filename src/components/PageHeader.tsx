import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}

function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 flex items-start gap-3 ${className}`}>
      {Icon && (
        <Icon
          className="mt-1 h-5 w-5 shrink-0 text-[#168b87]"
          strokeWidth={1.8}
        />
      )}
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#168b87]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#102a43] dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
