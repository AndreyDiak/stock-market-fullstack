import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import type { ReactNode } from 'react'

export interface GameModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** id элемента-заголовка для aria-labelledby */
  labelledBy?: string
  /** id элемента-описания для aria-describedby */
  describedBy?: string
  overlayClassName?: string
  /** Дополнительный декоративный слой поверх оверлея (виньетка и т.п.) */
  overlayExtra?: ReactNode
  panelClassName?: string
  zIndex?: number
}

const DEFAULT_OVERLAY = 'bg-black/65'
const DEFAULT_PANEL =
  'pointer-events-auto relative w-full max-w-md outline-none'

export function GameModal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  overlayClassName = DEFAULT_OVERLAY,
  overlayExtra,
  panelClassName = DEFAULT_PANEL,
  zIndex = 50,
}: GameModalProps) {
  const { refs, context } = useFloating({
    open,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) onClose()
    },
  })

  const dismiss = useDismiss(context, {
    outsidePress: true,
    outsidePressEvent: 'mousedown',
    escapeKey: true,
  })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])

  if (!open) return null

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className={overlayClassName}
        style={{ zIndex }}
        onClick={() => onClose()}
      />
      {overlayExtra ? (
        <div className="pointer-events-none fixed inset-0" style={{ zIndex }}>
          {overlayExtra}
        </div>
      ) : null}
      <FloatingFocusManager context={context} modal>
        <div
          ref={refs.setFloating}
          className="pointer-events-none fixed inset-0 flex items-center justify-center p-4 outline-none sm:p-6"
          style={{ zIndex: zIndex + 1 }}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          {...getFloatingProps()}
        >
          <div className={panelClassName}>{children}</div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}
