'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { importFromJSON, importFromMarkdown } from '@/lib/import-utils'
import { useTranslations } from 'next-intl'

export function ImportFavorites({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const t = useTranslations()
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const ext = file.name.split('.').pop()?.toLowerCase()

      let favorites
      if (ext === 'json') {
        favorites = importFromJSON(text)
      } else if (ext === 'md') {
        favorites = importFromMarkdown(text)
      } else {
        throw new Error('不支持的文件格式，仅支持 .json 和 .md')
      }

      if (favorites.length === 0) {
        alert('文件中没有找到有效的收藏内容')
        return
      }

      // 导入到数据库
      await db.favoritePrompts.bulkAdd(favorites)
      alert(`成功导入 ${favorites.length} 个收藏`)
      onImportSuccess?.()
    } catch (error: any) {
      console.error('导入失败:', error)
      alert(`导入失败: ${error.message}`)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {t('favoritesDialog.import')}
      </Button>
    </>
  )
}
