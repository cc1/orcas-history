/**
 * Hook for modal keyboard navigation
 *
 * Handles Escape to close, Arrow keys for navigation, and body scroll lock.
 */
import { useEffect, useCallback } from 'react'

interface UseModalKeyboardOptions {
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function useModalKeyboard({
  onClose,
  onPrev,
  onNext,
}: UseModalKeyboardOptions): void {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        onPrev?.()
        break
      case 'ArrowRight':
        onNext?.()
        break
    }
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])
}
