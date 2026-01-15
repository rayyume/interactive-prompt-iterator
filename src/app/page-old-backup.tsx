'use client'

import { useEffect, useRef } from 'react'
import { type Message } from '@ai-sdk/react'
import { Send, Trash2, StopCircle, User, Bot, Copy, Pencil, Code2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ChatSidebar } from '@/components/chat-sidebar'
import { db } from '@/lib/db'
import { useState } from 'react'
import { toast } from 'sonner'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { QuestionForm } from '@/components/question-form'
import { PromptProposalCard } from '@/components/prompt-proposal-card'
import { EnhancementForm } from '@/components/enhancement-form'

export default function Home() {
  const { apiKey, baseUrl, model, availableModels, setModel } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [sessionId, setSessionId] = useState<number | null>(null)
  const sessionIdRef = useRef(sessionId)

  // 关键修复：使用本地状态和 ref
  const [localInput, setLocalInput] = useState('')
  const aiContentRef = useRef('')

  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // 组件卸载时取消正在进行的请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('Component unmounting, aborting request')
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat history when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }

    const loadHistory = async () => {
      const history = await db.messages.where('sessionId').equals(sessionId).sortBy('createdAt')
      const uiMessages = history.map(m => ({
        id: m.id?.toString() || Math.random().toString(),
        role: m.role as any,
        content: m.content,
        toolInvocations: m.toolInvocations
      }))
      setMessages(uiMessages)
    }

    loadHistory()
  }, [sessionId])

  // 核心修复：完全绕过 useChat，直接使用 fetch
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!localInput.trim()) return

    // 取消之前的请求（如果有）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    let currentId = sessionId

    if (!currentId) {
      const title = localInput.slice(0, 30)
      currentId = await db.chatSessions.add({
        title,
        previewText: title,
        createdAt: new Date(),
        updatedAt: new Date()
      }) as number
      setSessionId(currentId)
    }

    const userMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: localInput
    }

    // 保存用户消息到数据库
    await db.messages.add({
      sessionId: currentId,
      role: 'user',
      content: localInput,
      createdAt: new Date()
    })

    // 立即显示用户消息
    setMessages(prev => [...prev, userMessage])
    setLocalInput('')
    setIsLoading(true)

    // 重置 AI 内容累积器
    aiContentRef.current = ''

    // 立即保存空的 AI 消息到数据库（防止 Fast Refresh 时丢失）
    const aiDbId = await db.messages.add({
      sessionId: currentId,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    })

    const aiMessageId = aiDbId.toString()
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: ''
    }

    // 添加空的 AI 消息占位符
    setMessages(prev => [...prev, aiMessage])

    try {
      console.log('Starting fetch request...')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-base-url': baseUrl
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: model
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      console.log('Starting to read stream...')
      let chunkCount = 0
      let lastChunkTime = Date.now()
      const TIMEOUT_MS = 30000 // 30秒超时

      while (true) {
        // 添加超时检测
        if (Date.now() - lastChunkTime > TIMEOUT_MS) {
          console.warn('Stream timeout - no data received for 30s')
          break
        }

        try {
          const { done, value } = await reader.read()

          if (done) {
            console.log('Stream complete normally')
            break
          }

          lastChunkTime = Date.now()
          chunkCount++
          const chunk = decoder.decode(value, { stream: true })
          console.log(`Received chunk ${chunkCount}:`, chunk.substring(0, 50))

          // 关键修复：直接累积纯文本内容
          aiContentRef.current += chunk
          console.log('Accumulated length:', aiContentRef.current.length)

          // 更新消息显示和数据库
          setMessages(prev => {
            const updated = prev.map(m =>
              m.id === aiMessageId ? { ...m, content: aiContentRef.current } : m
            )
            console.log('Updated messages count:', updated.length)
            return updated
          })

          // 实时更新数据库（每 10 个 chunk 更新一次，避免过于频繁）
          if (chunkCount % 10 === 0) {
            db.messages.update(parseInt(aiMessageId), {
              content: aiContentRef.current
            }).catch(err => console.error('Failed to update message:', err))
          }
        } catch (readError: any) {
          console.error('Stream read error:', readError)
          // 如果读取出错，退出循环
          break
        }
      }

      console.log('Final AI content length:', aiContentRef.current.length)

      // 最终更新数据库中的 AI 消息
      if (aiContentRef.current.length > 0) {
        await db.messages.update(parseInt(aiMessageId), {
          content: aiContentRef.current
        })

        // 更新会话
        await db.chatSessions.update(currentId, {
          updatedAt: new Date(),
          previewText: aiContentRef.current.slice(0, 50)
        })
      }

    } catch (error: any) {
      console.error('Chat error:', error)

      // 如果是用户主动取消或组件卸载导致的中断，不显示错误提示
      if (error.name === 'AbortError') {
        console.log('Request was aborted')
        toast.info('请求已取消', { duration: 2000 })
      } else {
        toast.error(`请求出错: ${error.message}`, { duration: 4000 })
      }
    } finally {
      console.log('Setting isLoading to false')
      setIsLoading(false)
      console.log('isLoading set to false')

      // 清理 AbortController 引用
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

  const handleNewChat = () => {
    setSessionId(null)
    setMessages([])
    setLocalInput('')
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleEdit = (content: string) => {
    setLocalInput(content)
  }

  const handleDeleteMessage = async (id: string, sessionId: number | null) => {
    setMessages(messages.filter((m: any) => m.id !== id))

    if (id) {
      const dbId = parseInt(id)
      if (!isNaN(dbId)) {
        await db.messages.delete(dbId)
        toast.success("消息已删除")
      }
    }
  }

  const append = (message: any) => {
    setMessages(prev => [...prev, message])
  }

  const stop = () => {
    console.log('Stop button clicked')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSessionSelect={setSessionId}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Prompt Iterator</h1>
            <Badge variant="outline" className="ml-2 text-xs text-muted-foreground font-normal">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-medium">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.length > 0 ? (
                  availableModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                    <SelectItem value="deepseek-coder">DeepSeek Coder</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <SettingsDialog />
            <div className="h-6 w-px bg-border mx-2" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleNewChat} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>清空对话</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Main Content Area */}
        <ScrollArea className="flex-1 w-full">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6 pb-4">
            {messages.length === 0 ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-10">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2">
                    构建完美的提示词
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                    通过多轮交互引导，将模糊的想法转化为精准、结构化的 AI 指令。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`group flex gap-4 relative mb-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role !== 'user' && (
                      <Avatar className="w-8 h-8 mt-1 border shrink-0 bg-secondary/20">
                        <AvatarFallback className="bg-transparent"><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                        <AvatarImage src="/ai-avatar.png" className="opacity-0" />
                      </Avatar>
                    )}

                    <div
                      className={`rounded-2xl px-5 py-3 max-w-[85%] shadow-sm ${m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-card text-card-foreground border rounded-tl-sm'
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                        {m.content}
                      </div>

                      {/* Generative UI for Tool Invocations */}
                      {m.toolInvocations?.map((toolInvocation: any) => {
                        const toolCallId = toolInvocation.toolCallId;

                        if (toolInvocation.toolName === 'ask_questions') {
                          return (
                            <div key={toolCallId} className="mt-3">
                              <QuestionForm
                                toolInvocation={toolInvocation}
                                addToolResult={({ toolCallId, result }: { toolCallId: string; result: any }) => {
                                  // Tool result handling
                                }}
                              />
                            </div>
                          )
                        }

                        if (toolInvocation.toolName === 'suggest_enhancements') {
                          return (
                            <div key={toolCallId} className="w-full mt-3">
                              <EnhancementForm
                                toolInvocation={toolInvocation}
                                onSubmit={(text) => {
                                  append({
                                    role: 'user',
                                    content: text
                                  })
                                }}
                              />
                            </div>
                          )
                        }

                        if (toolInvocation.toolName === 'propose_prompt') {
                          return (
                            <div key={toolCallId} className="w-full mt-3">
                              <PromptProposalCard
                                toolInvocation={toolInvocation}
                                addToolResult={({ toolCallId, result }: { toolCallId: string; result: any }) => {
                                  // Tool result handling
                                }}
                              />
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>

                    {m.role === 'user' && (
                      <Avatar className="w-8 h-8 mt-1 border shrink-0 bg-primary/10">
                        <AvatarFallback className="bg-transparent"><User className="w-5 h-5 text-primary" /></AvatarFallback>
                        <AvatarImage src="/user-avatar.png" className="opacity-0" />
                      </Avatar>
                    )}

                    {/* Message Actions */}
                    <div className={`absolute -bottom-6 ${m.role === 'user' ? 'right-12' : 'left-12'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(m.content)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      {m.role === 'user' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(m.content)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive" onClick={() => handleDeleteMessage(m.id, sessionId)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-8 h-8 mt-1 border shrink-0">
                      <AvatarFallback>AI</AvatarFallback>
                      <AvatarImage src="/ai-avatar.png" />
                    </Avatar>
                    <div className="bg-card border px-5 py-3 rounded-2xl flex items-center gap-2 rounded-tl-sm">
                      <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-1" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Floating Input Area */}
        <div className="p-4 bg-background border-t shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={onFormSubmit}
              className="relative flex items-end gap-2 p-2 rounded-xl border bg-muted/40 hover:border-primary/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
            >
              <Input
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 min-h-[50px]"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder="描述你的任务..."
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || (!localInput?.trim())}
                className={`h-10 w-10 mb-1 mr-1 shrink-0 rounded-lg ${isLoading ? 'hidden' : 'flex'}`}
              >
                <Send className="w-4 h-4" />
              </Button>
              {isLoading && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => stop()}
                  className="h-10 w-10 mb-1 mr-1 shrink-0 rounded-lg animate-in fade-in zoom-in"
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              )}
            </form>
            <div className="text-center text-xs text-muted-foreground mt-2">
              AI 可能会犯错。请核对重要信息。配置仅存储在本地。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
