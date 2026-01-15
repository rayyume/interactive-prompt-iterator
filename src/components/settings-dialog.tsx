'use client'

import { useState, useEffect } from 'react'
import { Settings, Check, AlertCircle, RefreshCw, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TEST_CONFIG = {
    apiKey: 'sk-xMUZVRACBogvAsbFxm2buTDoixjx7APxES7cBh5TELHABCe0',
    baseUrl: 'https://ai.huan666.de/v1',
    model: 'claude-sonnet-4-5-20250929',
    systemPrompt: '你是交互式提示词优化助手。你的目标是通过多轮对话，引导用户明确需求，并最终生成高质量的结构化提示词。你应该主动提出建议，使用Checkbox等形式让用户选择。'
}

const PROMPT_PRESETS = {
    default: '你是交互式提示词优化助手。你的目标是通过多轮对话，引导用户明确需求，并最终生成高质量的结构化提示词。你应该主动提出建议，使用Checkbox等形式让用户选择。',
    simple: '你是一个提示词助手，帮助用户优化和改进他们的提示词。'
}

export function SettingsDialog() {
    const { apiKey, baseUrl, model, systemPrompt, availableModels, setApiKey, setBaseUrl, setModel, setSystemPrompt, setAvailableModels } = useAppStore()
    const [open, setOpen] = useState(false)
    const [localConfig, setLocalConfig] = useState({ apiKey, baseUrl, model, systemPrompt })

    // Connection Test State
    const [isChecking, setIsChecking] = useState(false)
    const [checkStatus, setCheckStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [checkMessage, setCheckMessage] = useState('')

    // Prompt Preset State
    const [promptPreset, setPromptPreset] = useState<string>('custom')
    const [presetMsg, setPresetMsg] = useState('')

    // Initial sync
    useEffect(() => {
        if (open) {
            setLocalConfig({ apiKey, baseUrl, model, systemPrompt })
            setCheckStatus('idle')
        }
    }, [open, apiKey, baseUrl, model, systemPrompt])

    const normalizeUrl = (url: string) => {
        let cleanUrl = url.trim()
        if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1)
        return cleanUrl
    }

    const checkConnection = async () => {
        setIsChecking(true)
        setCheckStatus('idle')
        setCheckMessage('')
        setAvailableModels([])

        try {
            const cleanUrl = normalizeUrl(localConfig.baseUrl)
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }
            if (localConfig.apiKey && localConfig.apiKey !== 'demo') {
                headers['Authorization'] = `Bearer ${localConfig.apiKey}`
            }

            const response = await fetch(`${cleanUrl}/models`, {
                method: 'GET',
                headers
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            if (data && Array.isArray(data.data)) {
                const models = data.data.map((m: any) => m.id).sort()
                setAvailableModels(models)
                setCheckStatus('success')
                setCheckMessage(`连接成功！获取到 ${models.length} 个模型。`)
            } else {
                throw new Error('响应格式不符合 OpenAI 标准 (missing data array)')
            }
        } catch (error: any) {
            setCheckStatus('error')
            setCheckMessage(error.message || '连接失败')
        } finally {
            setIsChecking(false)
        }
    }

    const applyPreset = (type: 'deepseek' | 'openai' | 'demo') => {
        let newConfig = { ...localConfig }
        if (type === 'deepseek') {
            newConfig = {
                ...newConfig,
                baseUrl: 'https://ai.huan666.de/v1',
                apiKey: '',
                model: 'deepseek-chat'
            }
        } else if (type === 'openai') {
            newConfig = {
                ...newConfig,
                baseUrl: 'https://api.openai.com/v1',
                apiKey: '',
                model: 'gpt-4-turbo'
            }
        } else if (type === 'demo') {
            newConfig = {
                ...newConfig,
                baseUrl: 'https://api.openai.com/v1',
                apiKey: 'demo',
                model: 'gpt-3.5-turbo'
            }
        }
        setLocalConfig(newConfig)
        setCheckStatus('idle')
        setPresetMsg('预设已应用！')
        setTimeout(() => setPresetMsg(''), 2000)
    }

    const handlePresetChange = (val: string) => {
        setPromptPreset(val)
        if (val !== 'custom') {
            const presetContent = (PROMPT_PRESETS as any)[val]
            if (presetContent) {
                setLocalConfig(prev => ({ ...prev, systemPrompt: presetContent }))
            }
        }
    }

    const loadTestConfig = () => {
        setLocalConfig(TEST_CONFIG)
        setCheckStatus('idle')
        setCheckMessage('')
    }

    const handleSave = () => {
        setApiKey(localConfig.apiKey)
        setBaseUrl(localConfig.baseUrl)
        setModel(localConfig.model)
        setSystemPrompt(localConfig.systemPrompt)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>系统设置</DialogTitle>
                    <DialogDescription>
                        配置 API 连接与系统提示词逻辑
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="config" className="flex-1 flex flex-col min-h-0 w-full">
                    <TabsList className="mx-6 mt-2 grid w-[300px] grid-cols-2">
                        <TabsTrigger value="config">基础配置</TabsTrigger>
                        <TabsTrigger value="prompt">提示词管理</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto p-6 pt-4">
                        <TabsContent value="config" className="space-y-6 mt-0">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={loadTestConfig} className="flex-1">
                                    🧪 测试预设（一键配置）
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Base URL</Label>
                                    <Input
                                        value={localConfig.baseUrl}
                                        onChange={e => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                                        className="font-mono text-sm"
                                        placeholder="https://api.openai.com/v1"
                                    />
                                    <p className="text-xs text-muted-foreground">通常以 /v1 结尾</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        value={localConfig.apiKey}
                                        onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                                        className="font-mono text-sm"
                                        placeholder="sk-..."
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md border">
                                    <div className="flex items-center gap-2 text-sm">
                                        {isChecking ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                                            checkStatus === 'success' ? <Check className="w-4 h-4 text-green-500" /> :
                                                checkStatus === 'error' ? <AlertCircle className="w-4 h-4 text-destructive" /> : null}
                                        <span className={checkStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                                            {isChecking ? "连接中..." : checkMessage || "点击测试连接以获取模型列表"}
                                        </span>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={checkConnection} disabled={isChecking}>
                                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isChecking ? 'animate-spin' : ''}`} /> 测试连接
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>选择模型</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Input
                                                value={localConfig.model}
                                                onChange={e => setLocalConfig({ ...localConfig, model: e.target.value })}
                                                placeholder="自定义或选择..."
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        {availableModels.length > 0 && (
                                            <Select onValueChange={(val) => setLocalConfig(prev => ({ ...prev, model: val }))} value={localConfig.model}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="选择模型" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={5} className="max-h-[300px] z-50">
                                                    {availableModels.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">收到模型列表后，您可以直接选择或手动输入</p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="prompt" className="space-y-6 mt-0">
                            <div className="flex items-center justify-between">
                                <Label>系统提示词模板</Label>
                                <Select value={promptPreset} onValueChange={handlePresetChange}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-50">
                                        <SelectItem value="default">默认 (复杂交互)</SelectItem>
                                        <SelectItem value="simple">简单模式</SelectItem>
                                        <SelectItem value="custom">自定义</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Textarea
                                className="min-h-[400px] font-mono text-sm leading-relaxed p-4"
                                value={localConfig.systemPrompt}
                                onChange={e => {
                                    setLocalConfig({ ...localConfig, systemPrompt: e.target.value })
                                    setPromptPreset('custom')
                                }}
                                placeholder="在此输入 System Prompt..."
                            />
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="p-6 pt-2 border-t mt-auto bg-muted/10">
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" /> 保存更改
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
