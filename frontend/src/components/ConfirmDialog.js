import { useEffect, useRef } from "react";
import { usePopup } from "./PopupProvider";

/**
 * @deprecated Use {@link usePopup} `showConfirm()` — same PopupProvider styling.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDanger = false,
  busy = false
}) {
  const { showConfirm, closeConfirm } = usePopup();
  const openedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return undefined;
    }
    if (openedRef.current) {
      return undefined;
    }
    openedRef.current = true;

    showConfirm({
      type: confirmDanger ? "critical" : "warning",
      title,
      message: description,
      confirmLabel,
      cancelLabel,
      confirmDanger,
      onConfirm: async () => {
        if (onConfirm) {
          await onConfirm();
        }
      }
    }).then((ok) => {
      if (!ok) {
        onCancel?.();
      }
    });

    return () => {
      if (busy) {
        return;
      }
      closeConfirm();
    };
  }, [
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    confirmDanger,
    onConfirm,
    onCancel,
    showConfirm,
    closeConfirm,
    busy
  ]);

  return null;
}
