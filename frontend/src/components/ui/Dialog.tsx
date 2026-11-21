import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

export function Dialog({ open, title, description, children, onClose }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(92vw,36rem)] overflow-y-auto rounded-2xl border border-white/12 bg-[#141417] p-0 text-zinc-100 shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-5 border-b border-white/8 px-6 py-5">
        <div>
          <h2 id="dialog-title" className="font-display text-2xl text-white">
            {title}
          </h2>
          {description && (
            <p id="dialog-description" className="mt-1.5 text-sm leading-6 text-zinc-400">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-gold"
        >
          <span aria-hidden="true" className="text-2xl leading-none">×</span>
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
    </dialog>
  );
}
