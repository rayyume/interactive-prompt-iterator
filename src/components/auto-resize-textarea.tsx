'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AutoResizeTextareaProps {
  value: string
  onChange: (value: string) => void
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function AutoResizeTextarea({
  value,
  onChange,
  onPaste,
  placeholder,
  disabled,
  autoFocus,
  className = '',
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto'

    // 计算最大高度（屏幕高度的 1/6）
    const maxHeight = window.innerHeight / 6
    const scrollHeight = textarea.scrollHeight

    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
      setShowExpandButton(true)
    } else {
      textarea.style.height = `${scrollHeight}px`
      textarea.style.overflowY = 'hidden'
      setShowExpandButton(false)
    }
  }, [value])

  return (
    <>
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 min-h-[50px] transition-all whitespace-pre-wrap break-words ${className}`}
          rows={1}
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        />

        {showExpandButton && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(true)}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-md hover:bg-muted/80 transition-all animate-in fade-in zoom-in"
            title="展开输入框"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 放大对话框 */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>编辑输入内容</DialogTitle>
          </DialogHeader>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] resize-none"
            autoFocus
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
