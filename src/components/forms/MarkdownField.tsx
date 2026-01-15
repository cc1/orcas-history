import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useEditableSection } from './EditableSection'

interface MarkdownFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
}

export function MarkdownField({ value, onSave, placeholder }: MarkdownFieldProps): React.ReactElement {
  const { isEditing: sectionEditing } = useEditableSection()
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleBlur = async () => {
    if (editValue !== value) {
      setIsSaving(true)

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

  // Not in edit mode - render markdown
  if (!sectionEditing) {
    if (!value) {
      return (
        <p className="text-muted-foreground italic">
          {placeholder || '—'}
        </p>
      )
    }

    return (
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
        <ReactMarkdown
          components={{
            // Style links
            a: ({ children, href }) => (
              <a href={href} className="text-primary hover:underline font-semibold">
                {children}
              </a>
            ),
            // Style paragraphs
            p: ({ children }) => (
              <p className="mb-3 last:mb-0">{children}</p>
            ),
            // Style lists
            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
            ),
            // Style headings within content
            h3: ({ children }) => (
              <h3 className="font-semibold text-foreground mt-4 mb-2">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="font-medium text-foreground mt-3 mb-1">{children}</h4>
            ),
          }}
        >
          {value}
        </ReactMarkdown>
      </div>
    )
  }

  // In edit mode - show textarea
  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={8}
        className="w-full p-3 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
      />
      {isSaving && (
        <span className="absolute right-2 top-2 text-xs text-muted-foreground">Saving...</span>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Supports Markdown: **bold**, *italic*, [links](url), - lists
      </p>
    </div>
  )
}
