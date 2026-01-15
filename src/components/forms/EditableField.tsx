import { useState, useRef, useEffect } from 'react'

interface EditableFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
}

export function EditableField({ value, onSave, placeholder, multiline }: EditableFieldProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

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
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
    if (e.key === 'Enter' && !multiline) {
      handleBlur()
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full text-left p-2 -m-2 rounded hover:bg-muted/50 transition-colors group"
      >
        <span className={!value || value === 'TBD' ? 'text-muted-foreground italic' : ''}>
          {value || placeholder || 'Click to edit'}
        </span>
        <span className="ml-2 opacity-0 group-hover:opacity-50 text-xs">
          {isSaving ? '(saving...)' : '(edit)'}
        </span>
      </button>
    )
  }

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
      <textarea
        {...inputProps}
        rows={4}
      />
    )
  }

  return <input type="text" {...inputProps} />
}
