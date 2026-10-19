import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  labelledBy: string;
  onRequestClose: () => void;
  children: ReactNode;
}

/** Right-hand modal panel built on <dialog>: focus trap, Esc and backdrop handling come from the platform. */
export function Sheet({ open, labelledBy, onRequestClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onRequestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
    >
      {children}
    </dialog>
  );
}
