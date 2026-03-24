import { useEffect } from 'react';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }) {
  useEffect(() => {
    if (open) {
      const h = (e) => { if (e.key === 'Escape') onCancel?.(); };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-zinc-200">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
        <p className="text-zinc-600 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
