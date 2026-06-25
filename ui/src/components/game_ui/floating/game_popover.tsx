import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import type { Placement } from '@floating-ui/react'
import { useEffect, type ReactNode, type RefObject } from 'react'

export interface GamePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: RefObject<Element | null>
  children: ReactNode
  placement?: Placement
  offsetPx?: number
  modal?: boolean
  className?: string
  zIndex?: number
}

const DEFAULT_PANEL =
  'pointer-events-auto rounded-2xl border border-slate-700/50 bg-slate-900 p-3 text-white shadow-2xl shadow-black/50 outline-none'

export function GamePopover({
  open,
  onOpenChange,
  anchorRef,
  children,
  placement = 'bottom-start',
  offsetPx = 8,
  modal = false,
  className = DEFAULT_PANEL,
  zIndex = 40,
}: GamePopoverProps) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(offsetPx), flip(), shift({ padding: 8 })],
  })

  useEffect(() => {
    refs.setReference(anchorRef.current)
  }, [refs, anchorRef, open])

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
      <FloatingFocusManager context={context} modal={modal}>
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex }}
          className={className}
          {...getFloatingProps()}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}
