import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ open, title, description, confirmLabel = "Konfirmasi", children, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-[#102a43] shadow-2xl dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#a7b4c7]">{description}</p>
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold dark:border-[#263449] dark:bg-[#1b2a3d]">Batal</button>
          <button type="button" onClick={onConfirm} className="cursor-pointer rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13716d]">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
