import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({
  open,
  title = "Hapus Data?",
  description = "Data yang dipilih akan dihapus. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?",
  loading = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const cancelHandlerRef = useRef(onCancel);

  useEffect(() => {
    cancelHandlerRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
      return;
    }

    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        cancelHandlerRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-[#263449] dark:border-[#263449] bg-white dark:bg-[#111c2e] dark:bg-[#111c2e] p-6 text-[#102a43] dark:text-slate-100 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirm-modal-title" className="text-base font-semibold">{title}</h2>
              <button type="button" onClick={onCancel} disabled={loading} aria-label="Tutup modal" className="cursor-pointer rounded-md p-1 text-slate-500 dark:text-[#a7b4c7] hover:bg-slate-50 dark:hover:bg-[#1b2a3d] dark:bg-[#1b2a3d] disabled:cursor-not-allowed disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p id="confirm-modal-description" className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-[#a7b4c7]">{description}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="cursor-pointer rounded-lg border border-slate-200 dark:border-[#263449] dark:border-[#263449] bg-slate-50 dark:bg-[#1b2a3d] dark:bg-[#1b2a3d] px-4 py-2 text-sm font-semibold text-[#102a43] dark:text-slate-100 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50">Batal</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
