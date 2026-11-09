import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

function Select({ label, className = "", ...props }: SelectProps) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-[#a7b4c7]">
      {label && <span className="mb-1.5 block">{label}</span>}
      <select
        {...props}
        className={`theme-select w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#20b2aa] focus:ring-2 focus:ring-[#20b2aa]/15 dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-slate-100 ${className}`}
      />
    </label>
  );
}

export default Select;
