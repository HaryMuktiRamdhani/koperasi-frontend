interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-1 ${
        checked ? "bg-[#168b87]" : "bg-slate-300 dark:bg-slate-600"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default Toggle;
