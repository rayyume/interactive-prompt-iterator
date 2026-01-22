'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = () => {
    // 在中英文之间切换
    const currentIndex = locales.indexOf(locale as Locale)
    const nextIndex = (currentIndex + 1) % locales.length
    const newLocale = locales[nextIndex]

    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '')
    // Navigate to new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`)
  }

  // 获取当前语言的简短代码
  const getLanguageCode = (loc: string) => {
    return loc === 'zh-CN' ? 'CN' : 'EN'
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-[60px] gap-1 font-medium"
      onClick={switchLocale}
      title={`当前语言: ${localeNames[locale as Locale]} (点击切换)`}
    >
      <Globe className="h-4 w-4 shrink-0" />
      <span className="text-[10px] font-bold tracking-tight w-5 text-center">
        {getLanguageCode(locale)}
      </span>
    </Button>
  )
}
