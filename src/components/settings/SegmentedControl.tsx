interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={label}
      className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-[#263449]"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
            value === option.value
              ? "bg-[#e8f7f5] text-[#13716d] dark:bg-[#164e63] dark:text-[#5eead4]"
              : "text-slate-500 hover:bg-slate-50 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
