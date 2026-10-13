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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-text)] shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirm-modal-title" className="text-base font-semibold">{title}</h2>
              <button type="button" onClick={onCancel} disabled={loading} aria-label="Tutup modal" className="rounded-md p-1 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-secondary)] disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p id="confirm-modal-description" className="mt-2 text-sm leading-relaxed text-[var(--app-text-secondary)]">{description}</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:opacity-80 disabled:opacity-50">Batal</button>
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
