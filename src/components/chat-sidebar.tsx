'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { Plus, MessageSquare, Trash2, Menu, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/db'
import type { ChatSession } from '@/lib/db'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

interface ChatSidebarProps {
    currentSessionId: number | null
    onSessionSelect: (id: number) => void
    onNewChat: () => void
}

export function ChatSidebar({ currentSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
    const t = useTranslations();
    const locale = useLocale();
    const dateLocale = locale === 'zh-CN' ? zhCN : enUS;
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(256) // 默认 256px (w-64)
    const [isResizing, setIsResizing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('') // 搜索关键词
    const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]) // 过滤后的会话
    const scrollPositionRef = useRef<number>(0) // 保存滚动位置
    const searchInputRef = useRef<HTMLInputElement>(null) // 搜索框引用
    const isLoadingRef = useRef(false) // 防止重复加载

    const loadSessions = async (preserveScroll = true) => {
        // 防止重复加载
        if (isLoadingRef.current) return
        isLoadingRef.current = true

        try {
            // 保存当前滚动位置
            const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
            if (viewport && preserveScroll) {
                scrollPositionRef.current = viewport.scrollTop
            }

            const allSessions = await db.chatSessions.orderBy('updatedAt').reverse().toArray()
            setSessions(allSessions)
            setFilteredSessions(allSessions)

            // 滚动恢复由 useLayoutEffect 统一处理
        } finally {
            isLoadingRef.current = false
        }
    }

    // 使用 useLayoutEffect 在 DOM 更新后立即同步恢复滚动位置
    useLayoutEffect(() => {
        if (scrollPositionRef.current > 0) {
            const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
            if (viewport) {
                viewport.scrollTop = scrollPositionRef.current
            }
        }
    }, [sessions, filteredSessions])

    // 搜索过滤
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSessions(sessions)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = sessions.filter(session =>
            session.title?.toLowerCase().includes(query) ||
            session.previewText?.toLowerCase().includes(query)
        )
        setFilteredSessions(filtered)
    }, [searchQuery, sessions])

    // 从 localStorage 加载折叠状态和宽度
    useEffect(() => {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed')
        if (savedCollapsed !== null) {
            setIsCollapsed(savedCollapsed === 'true')
        }

        const savedWidth = localStorage.getItem('sidebar-width')
        if (savedWidth !== null) {
            setSidebarWidth(parseInt(savedWidth))
        }
    }, [])

    // 保存折叠状态到 localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', String(newState))
    }

    // 快捷键监听：Ctrl+K / Cmd+K 聚焦搜索框
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K (Windows/Linux) 或 Cmd+K (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
                // 如果侧边栏折叠，则展开
                if (isCollapsed) {
                    setIsCollapsed(false)
                    localStorage.setItem('sidebar-collapsed', 'false')
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isCollapsed])

    // 处理拖动调整宽度
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return

            const newWidth = e.clientX
            // 限制宽度在 200px 到 500px 之间
            if (newWidth >= 200 && newWidth <= 500) {
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false)
                localStorage.setItem('sidebar-width', String(sidebarWidth))
            }
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, sidebarWidth])

    useEffect(() => {
        loadSessions()
    }, [])

    // 监听当前会话变化时刷新列表（保持滚动位置）
    useEffect(() => {
        if (currentSessionId) {
            // 延迟刷新，确保点击事件完成
            const timer = setTimeout(() => {
                loadSessions(true) // preserveScroll = true
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [currentSessionId])

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        e.preventDefault()
        if (confirm(t('sidebar.deleteConfirm'))) {
            try {
                await db.messages.where('sessionId').equals(id).delete()
                await db.chatSessions.delete(id)
                await loadSessions()
                if (currentSessionId === id) {
                    onNewChat()
                }
                toast.success(t('sidebar.deleteSuccess'))
            } catch (error) {
                console.error("Failed to delete session:", error)
                toast.error(t('sidebar.deleteFailed'))
            }
        }
    }

    const SidebarContent = ({ showToggle = false }: { showToggle?: boolean }) => (
        <div className="flex flex-col h-full py-4">
            <div className={`px-4 mb-4 flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
                {!isCollapsed && (
                    <Button
                        className="flex-1 justify-start gap-2"
                        variant="outline"
                        onClick={() => {
                            onNewChat()
                            setIsOpen(false)
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        {t('sidebar.newConversation')}
                    </Button>
                )}
                {showToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="shrink-0"
                        data-sidebar-toggle
                        title={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                )}
            </div>

            {/* 搜索框 */}
            {!isCollapsed && (
                <div className="px-4 mb-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                            ref={searchInputRef}
                            placeholder={t('sidebar.searchPlaceholder')}
                            className="pl-9 pr-9 h-10 text-sm rounded-lg border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md hover:bg-muted transition-all duration-200 animate-in fade-in zoom-in"
                                onClick={() => setSearchQuery('')}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {!searchQuery && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <kbd className="px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted border border-muted-foreground/20 rounded">
                                    {t('sidebar.searchShortcut')}
                                </kbd>
                            </div>
                        )}
                    </div>
                    {searchQuery && (
                        <div className="mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                    {filteredSessions.length}
                                </span>
                                <span>{t('sidebar.resultsCount')}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            <ScrollArea className="flex-1 px-4 overflow-auto">
                <div className="flex flex-col gap-2 pb-4">
                    {filteredSessions.map((session) => (
                        <div
                            key={session.id}
                            className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg cursor-pointer transition-all border ${currentSessionId === session.id
                                ? 'bg-secondary border-primary/20'
                                : 'hover:bg-muted/50 border-transparent'
                                } ${isCollapsed ? 'overflow-visible' : ''}`}
                            onClick={() => {
                                // 在点击前保存滚动位置
                                const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
                                if (viewport) {
                                    scrollPositionRef.current = viewport.scrollTop
                                }

                                onSessionSelect(session.id!)
                                setIsOpen(false)
                            }}
                        >
                            {isCollapsed ? (
                                <>
                                    <MessageSquare className="w-5 h-5" />
                                    {/* 折叠状态下的删除按钮 - 悬浮显示在右侧 */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 h-7 w-7 bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-all shrink-0 rounded-full z-50 ml-1"
                                        onClick={(e) => handleDelete(e, session.id!)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0 pr-2">
                                        <span className="font-medium text-sm break-words line-clamp-2">
                                            {session.title || t('sidebar.untitled')}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {formatDistanceToNow(session.updatedAt, { addSuffix: true, locale: dateLocale })}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0 self-start mt-0.5"
                                        onClick={(e) => handleDelete(e, session.id!)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}

                    {filteredSessions.length === 0 && searchQuery && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('sidebar.noResults')}</p>
                            <p className="text-xs mt-1">{t('sidebar.tryOtherKeywords')}</p>
                        </div>
                    )}

                    {sessions.length === 0 && !searchQuery && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            {t('sidebar.noHistory')}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className="hidden md:flex border-r flex-col bg-card/30 shrink-0 relative h-screen overflow-hidden"
                style={{
                    width: isCollapsed ? '64px' : `${sidebarWidth}px`,
                    transition: isCollapsed ? 'width 0.3s' : 'none'
                }}
            >
                <SidebarContent showToggle={true} />

                {/* 可拖动的分隔条 */}
                {!isCollapsed && (
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors ${
                            isResizing ? 'bg-primary' : ''
                        }`}
                        onMouseDown={handleMouseDown}
                    />
                )}
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4 z-20">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <SidebarContent showToggle={false} />
                </SheetContent>
            </Sheet>
        </>
    )
}
