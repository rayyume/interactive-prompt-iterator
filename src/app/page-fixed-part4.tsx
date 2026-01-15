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
