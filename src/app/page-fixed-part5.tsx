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
