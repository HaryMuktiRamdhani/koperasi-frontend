import type { LucideIcon } from "lucide-react";
import IconBadge from "../IconBadge";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <IconBadge icon={Icon} />
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>}
      </div>
    </div>
  );
}

export default PageHeader;
