type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  singleButton?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  singleButton = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="poke-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="poke-confirm-title" className="text-lg text-[#1a2e1a]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-black/65">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          {!singleButton && (
            <button
              type="button"
              className="rounded-lg border border-black/15 px-3.5 py-1.5 text-sm text-black/70 hover:bg-black/[0.04]"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className="rounded-lg bg-[#1f6b3a] px-3.5 py-1.5 text-sm text-white hover:bg-[#185830]"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
