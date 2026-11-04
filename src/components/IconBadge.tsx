import type { LucideIcon } from "lucide-react";

export type IconTone = "blue" | "cyan" | "green" | "violet" | "orange" | "red" | "slate" | "teal";

const tones: Record<IconTone, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300",
  red: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300",
  slate: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300",
};

function IconBadge({ icon: Icon, tone = "teal", className = "", iconClassName = "h-5 w-5" }: { icon: LucideIcon; tone?: IconTone; className?: string; iconClassName?: string }) {
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]} ${className}`}>
      <Icon className={iconClassName} strokeWidth={1.8} />
    </span>
  );
}

export default IconBadge;
