'use client'

import { useState, useRef } from 'react'
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

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  return (
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
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            点击或拖拽上传文件
          </p>
          <p className="text-xs text-muted-foreground">
            支持图片、PDF、DOCX（最大 10MB）
          </p>
          {!modelSupportsVision && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>当前模型不支持图片识别</span>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.docx"
        onChange={handleFileChange}
      />
    </div>
  )
}
