import { useState, useRef, useEffect } from 'react'
import { useEditableSection } from './EditableSection'

interface EditableFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  /** When true, field is always editable without requiring EditableSection */
  alwaysEditable?: boolean
}

export function EditableField({ value, onSave, placeholder, multiline, alwaysEditable }: EditableFieldProps): React.ReactElement {
  const { isEditing: sectionEditing } = useEditableSection()
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // In alwaysEditable mode, always show input; otherwise check section editing state
  const showInput = alwaysEditable || sectionEditing

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleBlur = async () => {
    if (editValue !== value) {
      setIsSaving(true)

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSave(editValue)
        } finally {
          setIsSaving(false)
        }
      }, 500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value)
      inputRef.current?.blur()
    }
    if (e.key === 'Enter' && !multiline) {
      inputRef.current?.blur()
    }
  }

  // Not in edit mode - display value as text
  if (!showInput) {
    return (
      <span className={!value || value === 'TBD' ? 'text-muted-foreground italic' : ''}>
        {value || placeholder || '—'}
      </span>
    )
  }

  // In edit mode - show input directly (no extra click required)
  const inputProps = {
    ref: inputRef as any,
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditValue(e.target.value),
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    placeholder,
    className: 'w-full p-2 -m-2 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50',
  }

  if (multiline) {
    return (
      <div className="relative">
        <textarea {...inputProps} rows={4} />
        {isSaving && (
          <span className="absolute right-2 top-2 text-xs text-muted-foreground">Saving...</span>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <input type="text" {...inputProps} />
      {isSaving && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Saving...</span>
      )}
    </div>
  )
}
