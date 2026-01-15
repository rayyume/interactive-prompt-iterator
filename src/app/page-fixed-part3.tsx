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
