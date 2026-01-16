'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Image, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface FileUploadProps {
  onFileSelect: (file: File, preview?: string) => void
  onFileRemove: () => void
  currentFile: File | null
  currentPreview?: string
  modelSupportsVision: boolean
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  currentFile,
  currentPreview,
  modelSupportsVision
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showFullDropZone, setShowFullDropZone] = useState(false)
  const dragCounterRef = useRef(0)

  // 全局拖拽监听
  useEffect(() => {
    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current++
      if (dragCounterRef.current === 1) {
        setShowFullDropZone(true)
      }
    }

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        setShowFullDropZone(false)
      }
    }

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setShowFullDropZone(false)
    }

    window.addEventListener('dragenter', handleGlobalDragEnter)
    window.addEventListener('dragleave', handleGlobalDragLeave)
    window.addEventListener('dragover', handleGlobalDragOver)
    window.addEventListener('drop', handleGlobalDrop)

    return () => {
      window.removeEventListener('dragenter', handleGlobalDragEnter)
      window.removeEventListener('dragleave', handleGlobalDragLeave)
      window.removeEventListener('dragover', handleGlobalDragOver)
      window.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    const isDoc = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    // 检查图片支持
    if (isImage && !modelSupportsVision) {
      toast.error('当前模型不支持图片识别，请更换支持 Vision 的模型')
      return
    }

    // 检查文件类型
    if (!isImage && !isPDF && !isDoc) {
      toast.error('仅支持图片、PDF 和 DOCX 文件')
      return
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB')
      return
    }

    // 处理图片预览
    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onFileSelect(file, e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      onFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setShowFullDropZone(false)
    dragCounterRef.current = 0

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  return (
    <>
      {/* 全屏拖拽上传区域 */}
      {showFullDropZone && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-2xl w-full mx-4">
            <div className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-primary/50 bg-primary/5'
            }`}>
              <Upload className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce" />
              <h3 className="text-2xl font-bold mb-2">释放以上传文件</h3>
              <p className="text-muted-foreground mb-4">
                支持图片、PDF、DOCX（最大 10MB）
              </p>
              {!modelSupportsVision && (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">当前模型不支持图片识别</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 常规上传区域 */}
      <div className="relative">
      {currentFile ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border">
          {currentPreview ? (
            <img src={currentPreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-muted-foreground/10 rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(currentFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onFileRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          title="上传文件"
        >
          <Upload className="w-4 h-4" />
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.docx"
        onChange={handleFileChange}
      />
    </div>
    </>
  )
}
