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

    const aiMessageId = Math.random().toString()
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
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      console.log('Starting to read stream...')
      let chunkCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream complete')
          break
        }

        chunkCount++
        const chunk = decoder.decode(value, { stream: true })
        console.log(`Received chunk ${chunkCount}:`, chunk.substring(0, 50))

        // 解析流式数据
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const jsonStr = line.substring(2)
            try {
              const parsed = JSON.parse(jsonStr)
              const text = parsed || ''

              // 关键修复：使用 ref 累积内容
              aiContentRef.current += text
              console.log('Accumulated length:', aiContentRef.current.length)

              // 更新消息显示
              setMessages(prev => prev.map(m =>
                m.id === aiMessageId ? { ...m, content: aiContentRef.current } : m
              ))
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }

      console.log('Final AI content length:', aiContentRef.current.length)

      // 保存 AI 消息到数据库
      await db.messages.add({
        sessionId: currentId,
        role: 'assistant',
        content: aiContentRef.current,
        createdAt: new Date()
      })

      // 更新会话
      await db.chatSessions.update(currentId, {
        updatedAt: new Date(),
        previewText: aiContentRef.current.slice(0, 50)
      })

    } catch (error: any) {
      console.error('Chat error:', error)
      toast.error(`请求出错: ${error.message}`, { duration: 4000 })
    } finally {
      setIsLoading(false)
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
    setIsLoading(false)
  }
