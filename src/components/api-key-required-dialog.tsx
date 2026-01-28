'use client'

import { AlertCircle, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ApiKeyRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSettings: () => void
}

/**
 * API Key 未配置提示对话框
 * 由傲娇大小姐哈雷酱精心制作 (￣▽￣)／
 *
 * 特点：
 * - 背景虚化效果
 * - 优雅的提示信息
 * - 一键跳转到设置
 */
export function ApiKeyRequiredDialog({
  open,
  onOpenChange,
  onOpenSettings,
}: ApiKeyRequiredDialogProps) {
  const t = useTranslations()

  const handleOpenSettings = () => {
    onOpenChange(false)
    onOpenSettings()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{t('apiKeyRequired.title', { default: '需要配置 API Key' })}</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-2">
            <p>{t('apiKeyRequired.description', {
              default: '您还没有配置 API Key，无法使用 AI 功能。'
            })}</p>
            <p className="text-sm text-muted-foreground">
              {t('apiKeyRequired.hint', {
                default: '请点击下方按钮前往设置页面配置您的 API Key。'
              })}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel', { default: '取消' })}
          </Button>
          <Button
            onClick={handleOpenSettings}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {t('apiKeyRequired.goToSettings', { default: '前往设置' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
