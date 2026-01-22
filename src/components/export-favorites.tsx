'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { db, type FavoritePrompt } from '@/lib/db'
import { exportToMarkdown, exportToJSON } from '@/lib/export-utils'
import { useTranslations } from 'next-intl'

export function ExportFavorites() {
  const t = useTranslations()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'md' | 'json' | 'docx') => {
    setIsExporting(true)
    try {
      const favorites = await db.favoritePrompts.toArray()

      if (favorites.length === 0) {
        alert(t('favoritesDialog.noFavorites'))
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'md') {
        content = exportToMarkdown(favorites)
        filename = `favorites-${Date.now()}.md`
        mimeType = 'text/markdown'
      } else if (format === 'json') {
        content = exportToJSON(favorites)
        filename = `favorites-${Date.now()}.json`
        mimeType = 'application/json'
      } else {
        // DOCX 格式暂不实现，提示用户
        alert('DOCX 格式导出功能开发中')
        return
      }

      // 创建下载链接
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {t('favoritesDialog.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('md')}>
          导出为 Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          导出为 JSON (.json)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('docx')} disabled>
          导出为 Word (.docx) - 开发中
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
