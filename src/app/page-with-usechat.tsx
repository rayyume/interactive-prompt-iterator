'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from 'ai/react'
import { Send, Trash2, StopCircle, User, Bot } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ChatSidebar } from '@/components/chat-sidebar'
import { db } from '@/lib/db'
import { toast } from 'sonner'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { QuestionForm } from '@/components/question-form'
import { PromptProposalCard } from '@/components/prompt-proposal-card'
import { EnhancementForm } from '@/components/enhancement-form'

export default function Home() {
  const { apiKey, baseUrl, model, availableModels, setModel } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [sessionId, setSessionId] = useState<number | null>(null)
  const sessionIdRef = useRef(sessionId)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // 使用 useChat hook（关键修复）
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    append
  } = useChat({
    api: '/api/chat',
    headers: () => ({
      'x-api-key': apiKey || '',
      'x-base-url': baseUrl || 'https://api.openai.com/v1'
    }),
    body: {
      model: model
    },
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error(`请求出错: ${error.message}`, { duration: 4000 })
    },
    onFinish: (message) => {
      console.log('Message finished:', message)
      // 保存到数据库
      saveMessageToDb(message)
    }
  })

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 保存消息到数据库的函数
  const saveMessageToDb = async (message: any) => {
    if (!sessionIdRef.current) return

    try {
      await db.messages.add({
        sessionId: sessionIdRef.current,
        role: message.role,
        content: message.content,
        toolInvocations: message.toolInvocations,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  // 从数据库加载历史消息
  useEffect(() => {
    if (!sessionId) return

    const loadHistory = async () => {
      try {
        const history = await db.messages
          .where('sessionId')
          .equals(sessionId)
          .sortBy('createdAt')

        console.log(`Loaded ${history.length} messages from DB`)

        // 将数据库消息转换为 useChat 格式
        // 注意：这里不直接设置 messages，因为 useChat 管理 messages
        // 我们需要在初始化时加载，或者使用 setMessages（如果 useChat 提供）
      } catch (error) {
        console.error('Failed to load history:', error)
      }
    }

    loadHistory()
  }, [sessionId])

  // 监听 messages 变化，实时保存到数据库
  useEffect(() => {
    if (!sessionIdRef.current || messages.length === 0) return

    const saveMessages = async () => {
      for (const message of messages) {
        // 检查消息是否已存在
        const existing = await db.messages
          .where('sessionId')
          .equals(sessionIdRef.current!)
          .and(m => m.content === message.content && m.role === message.role)
          .first()

        if (!existing) {
          await db.messages.add({
            sessionId: sessionIdRef.current!,
            role: message.role,
            content: message.content,
            toolInvocations: message.toolInvocations,
            createdAt: new Date()
          })
        }
      }
    }

    saveMessages().catch(err => console.error('Failed to save messages:', err))
  }, [messages])

  // 创建新会话
  const createNewSession = async () => {
    const title = '新对话'
    const newSessionId = await db.chatSessions.add({
      title,
      previewText: title,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setSessionId(newSessionId)
  }

  // 删除会话
  const deleteSession = async (id: number) => {
    await db.chatSessions.delete(id)
    await db.messages.where('sessionId').equals(id).delete()
    if (sessionId === id) {
      setSessionId(null)
    }
    toast.success('对话已删除')
  }

  // 提交表单时创建会话
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionId) {
      const title = input.slice(0, 30)
      const newSessionId = await db.chatSessions.add({
        title,
        previewText: title,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setSessionId(newSessionId)
    }

    handleSubmit(e)
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SettingsDialog />
        </div>

        {/* Messages Area */}
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
                    className={`group flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {m.role === 'assistant' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback>
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'flex-1'}`}>
                      <div className={`rounded-lg px-4 py-3 ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>

                      {/* Tool Invocations */}
                      {m.toolInvocations?.map((toolInvocation: any) => {
                        const toolCallId = toolInvocation.toolCallId

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
                              <PromptProposalCard toolInvocation={toolInvocation} />
                            </div>
                          )
                        }

                        return null
                      })}
                    </div>

                    {m.role === 'user' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="描述你的需求..."
              disabled={isLoading}
              className="flex-1"
            />
            {isLoading ? (
              <Button type="button" onClick={stop} variant="destructive">
                <StopCircle className="w-4 h-4 mr-2" />
                停止
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()}>
                <Send className="w-4 h-4 mr-2" />
                发送
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
