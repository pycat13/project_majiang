# MahjongLab Permanent Context

最后更新：2026-04-28

## 1. 本地启动记录

这份记录基于一次已经验证通过的本地启动过程，适合作为后续继续开发时的固定上下文。

### 1.1 工作区

- 仓库根目录：`D:\project_majiang\MahjongLab_v2`
- 后端目录：`services/api`
- 前端目录：`apps/web`

### 1.2 Python 环境

本次实际用于启动后端的 Python 解释器：

- `D:\python_mini_canda\python.exe`

解释器版本：

- `Python 3.11.11 | packaged by Anaconda, Inc.`

对应 `site-packages`：

- `D:\python_mini_canda`
- `D:\python_mini_canda\Lib\site-packages`

结论：

- 当前项目后端不是跑在仓库内 `.venv` 上，而是跑在一个现成的 Conda/Anaconda 风格 Python 环境上。
- 后端 `pyproject.toml` 要求 `requires-python = ">=3.11"`，当前环境满足要求。

### 1.3 后端启动方式

实际执行过的命令：

```powershell
cd services\api
python -m pip install -e .
python -m uvicorn app.main:app --reload
```

说明：

- `pip install -e .` 以 editable 方式安装了 `services/api` 这个 Python 包。
- 安装期间实际拉起了这些关键依赖：
  - `fastapi`
  - `uvicorn`
  - `python-multipart`
  - `playwright`
- `sqlalchemy`、`pydantic` 在当前 Python 环境里原本就已存在。

实际启动结果：

- 服务地址：`http://127.0.0.1:8000`
- 健康检查：`http://127.0.0.1:8000/api/health`
- 实测健康检查返回：`{"status":"ok"}`

`uvicorn` 启动日志表明：

- 监听目录：`services/api`
- 使用 `--reload` 热重载
- 应用启动成功，并已正常响应 `/api/health`、`/api/me`、`/api/dashboard/summary`、`/api/reviews` 等请求

### 1.4 前端启动方式

实际执行过的命令：

```powershell
cd apps\web
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

说明：

- `npm.cmd install` 已成功安装前端依赖。
- 启动方式基于 `vite` 开发服务器。

实际启动结果：

- 前端地址：`http://127.0.0.1:5173/`
- 实测首页状态码：`200`

### 1.5 前后端联动关系

- 前端开发环境将 `/api` 代理到 `http://127.0.0.1:8000`
- 因此本地开发时只需要分别启动：
  - 一个 `uvicorn`
  - 一个 `vite`

### 1.6 本地运行时数据

后端 README 明确说明运行时会自动创建：

- `services/api/data/mahjonglab.db`
- `services/api/data/storage/sources`
- `services/api/data/storage/normalized`
- `services/api/data/storage/uploads`
- `services/api/data/storage/reviews`

这意味着当前阶段的开发形态是：

- 数据库：`SQLite`
- 对象存储：本地文件系统

而不是生产目标中的 PostgreSQL / Redis / MinIO。

## 2. 当前项目认识

## 2.1 项目目标

MahjongLab 当前是一个“复盘优先”的麻将项目。

从现有文档和代码看，V1 的核心策略是：

- 先把牌谱导入与 AI 复盘链路做通
- 再把 AI 对战链路逐步接到同一套 `mjai` 事件流之上

这是整个仓库当前最重要的产品和架构方向。

## 2.2 当前代码组织

仓库根下目前最关键的目录有：

- `apps/web`
  - Web 前端
- `services/api`
  - 当前已实际运行的后端 API
- `Mortal`
  - AI/复盘相关上游能力与依赖
- `mjai-reviewer`
  - 复盘相关能力
- `mjai.app`
  - 另一个与 `mjai` 生态相关的组件
- `docs`
  - 架构、环境、验收等文档
- `原型设计`
  - 原型/迁移来源材料

从 `docs/ARCHITECTURE_V1.md` 看，目标架构还包含：

- `services/review-worker`
- `services/ai-gateway`
- `services/match-service`

但这些目标服务目前还没有在现阶段代码里作为独立运行单元落地。

## 2.3 后端现状

后端使用：

- Python 3.11
- FastAPI
- SQLAlchemy
- Pydantic v2

当前后端入口是 `services/api/app/main.py`，它直接承担了：

- API 路由注册
- 启动时建表
- 初始化默认用户
- 复盘任务创建与查询
- 复盘报告查询
- 错题库增删查

从代码可以确认，后端当前已经实现这些主要接口：

- `/api/health`
- `/api/me`
- `/api/dashboard/summary`
- `/api/platforms/replay-sources`
- `/api/uploads`
- `/api/review-jobs`
- `/api/review-jobs/{task_id}`
- `/api/review-jobs/{task_id}/result`
- `/api/review-jobs/{task_id}/retry`
- `/api/reviews`
- `/api/reviews/{review_id}`
- `/api/reviews/{review_id}/entries`
- `/api/reviews/{review_id}/mistakes`
- `/api/mistakes`
- `DELETE /api/mistakes/{mistake_id}`
- `DELETE /api/reviews/{review_id}`

当前后端的关键特点：

- 开发默认是单用户本地模式，没有真正的多用户鉴权体系
- 默认用户会在启动时自动创建
- 数据存储是 SQLite + 本地文件
- 复盘任务虽然在架构上属于 worker 职责，但当前仍由 API 进程内执行器处理

也就是说，`services/api` 目前既是 API 层，也是阶段性的“最小闭环执行器”。

## 2.4 前端现状

前端使用：

- Vite
- React 18
- React Router 7
- Tailwind CSS 4
- TanStack Query
- Zustand

路由层面已经接通的页面包括：

- `/`
- `/review/import`
- `/review/task/:taskId`
- `/review/report/:reportId`
- `/review/history`
- `/training/mistakes`

而这些对战相关页面目前还是占位：

- `/play/config`
- `/play/game/:roomId`
- `/play/result/:sessionId`
- `/play/history`

从 `apps/web/src/app/lib/api.ts` 可以确认，前端不是 mock 数据驱动，而是已经在直接调用真实后端 API。

这意味着当前项目最成熟、最可用的主线是：

- 导入牌谱
- 创建复盘任务
- 轮询任务状态
- 查看复盘报告
- 把偏差条目加入错题库
- 在错题库中继续查看和管理

## 2.5 复盘能力边界

根据 `services/api/README.md` 与架构文档，当前已支持或计划支持的牌谱来源包括：

- `internal_match`
- `upload_file`
- `inline_json`
- `tenhou_url`
- `tenhou_id`
- `majsoul_file`
- `majsoul_url`

但当前也有明确限制：

- `Tenhou` 三麻牌谱暂不支持
- `Tenhou` 下载依赖外部网络可达性
- `Majsoul URL` 依赖本机浏览器里已有登录态
- 目标玩家座位有些场景仍需显式指定

换句话说，项目主线已经打通，但外部平台接入的稳定性仍明显依赖本机环境和第三方网站状态。

## 2.6 架构阶段判断

我对当前项目阶段的判断是：

- 这是一个“复盘 MVP 已经可跑通、对战体系仍在后续阶段”的仓库。
- 目前最真实的生产性代码集中在 `services/api` 和 `apps/web`。
- 文档中的目标架构明显比当前落地代码更大，属于先收敛 MVP、后拆服务的路线。
- 当前最值得继续投入的方向，仍然是把复盘链路做稳、把导入兼容性和任务执行稳定性做好。

## 2.7 后续协作建议

如果未来继续在这个仓库里工作，建议默认把下面这些信息当作基础前提：

- 本地开发默认先看 `services/api` 和 `apps/web`
- 启动时优先确认 Python 解释器是不是 `D:\python_mini_canda\python.exe`
- 后端要先于前端启动
- 本地问题排查优先看：
  - `services/api/README.md`
  - `apps/web/README.md`
  - `docs/ARCHITECTURE_V1.md`
- 如果遇到复盘任务失败，不一定是 Web 或 API 本身的问题，也可能是：
  - `Mortal` 配置缺失
  - 浏览器登录态缺失
  - 外部牌谱站点不可达
  - 本地依赖未满足
