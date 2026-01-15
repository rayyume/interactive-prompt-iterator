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

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])
