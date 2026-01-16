# 用户交互流程图

## 完整交互流程

```mermaid
graph TD
    Start([用户打开应用]) --> Input[输入模糊需求]
    Input --> Upload{需要上传文件?}
    Upload -->|是| DragDrop[拖拽文件到页面<br/>或点击上传按钮]
    Upload -->|否| Submit[点击发送]
    DragDrop --> Submit

    Submit --> AI[AI 分析需求]
    AI --> Questions[展示多维度选项]

    Questions --> UserSelect[用户选择偏好]
    UserSelect --> Generate[生成结构化提示词]

    Generate --> Preview[展示预览和结构详情]
    Preview --> UserAction{用户操作}

    UserAction -->|复制| Copy[复制提示词]
    UserAction -->|收藏| Favorite[添加到收藏]
    UserAction -->|全屏查看| Fullscreen[全屏模式]
    UserAction -->|采纳| Accept[采纳此版本]
    UserAction -->|修改| Feedback[输入反馈意见]

    Feedback --> AI
    Copy --> End([完成])
    Favorite --> FavTab[切换到收藏标签页]
    Fullscreen --> Preview
    Accept --> End

    FavTab --> ManageFav{管理收藏}
    ManageFav -->|搜索| Search[Ctrl+K 搜索]
    ManageFav -->|编辑| Edit[编辑收藏内容]
    ManageFav -->|删除| Delete[删除收藏]
    ManageFav -->|复制| CopyFav[复制收藏内容]

    Search --> FavTab
    Edit --> FavTab
    Delete --> FavTab
    CopyFav --> End
```

## 核心功能流程

### 1. 提示词生成流程
```mermaid
sequenceDiagram
    participant U as 用户
    participant UI as 界面
    participant AI as AI 引擎
    participant DB as 本地数据库

    U->>UI: 输入模糊需求
    U->>UI: (可选)上传文件
    U->>UI: 点击发送
    UI->>AI: 发送需求和文件
    AI->>UI: 返回多维度选项
    UI->>U: 展示选项表单
    U->>UI: 选择偏好
    UI->>AI: 提交选择
    AI->>UI: 生成结构化提示词
    UI->>U: 展示预览和详情
    U->>UI: 采纳/修改/收藏
    UI->>DB: 保存对话历史
```

### 2. 收藏管理流程
```mermaid
sequenceDiagram
    participant U as 用户
    participant UI as 界面
    participant DB as IndexedDB

    U->>UI: 点击收藏按钮
    UI->>DB: 检查是否已收藏
    alt 未收藏
        UI->>DB: 添加到收藏
        DB->>UI: 返回收藏 ID
        UI->>U: 显示已收藏状态
    else 已收藏
        UI->>DB: 删除收藏
        DB->>UI: 确认删除
        UI->>U: 显示未收藏状态
    end
```

### 3. 文件上传流程
```mermaid
graph LR
    A[用户拖拽文件] --> B{检测到拖拽}
    B -->|是| C[全屏显示上传区]
    C --> D[用户释放文件]
    D --> E{验证文件}
    E -->|通过| F[处理文件]
    E -->|失败| G[显示错误提示]
    F --> H[显示文件预览]
    G --> I[返回初始状态]
    H --> J[文件已上传]
```

## 关键交互点

### 快捷键
- `Ctrl+K` / `Cmd+K`: 打开 Spotlight 搜索
- `Tab`: 在搜索中切换对话/收藏
- `↑↓`: 在搜索结果中导航
- `Enter`: 选择搜索结果

### 状态反馈
- 收藏按钮: 黄色表示已收藏,灰色表示未收藏
- 拖拽上传: 全屏动画提示上传区域
- 标签页切换: 滑动动画效果
- 加载状态: 脉冲动画和加载提示

### 数据持久化
- 对话历史: 自动保存到 IndexedDB
- 收藏提示词: 本地存储,支持搜索和管理
- 用户设置: API Key、Base URL、模型选择
