# MahjongLab_v2 Startup Guide

这份文档用于给第一次接手本项目的人（或 AI）快速说明：

- 我们已经做了哪些关键改动
- 如何在本机启动并验证项目
- 对战与复盘现在分别走什么链路
- 常见问题如何排查

---

## 1. 当前改动总览（已落地）

### 1.1 MahjongLab_v2 <-> Mahjong-AI 集成

- MahjongLab 的 `play` 模块不再是占位页面，已经可实际拉起 `Mahjong-AI` 本地对战。
- 后端通过 `play_launcher` 启动三类进程：
  - `Mahjong-AI` socket 服务器
  - `websockify` 转发
  - `http.server` 托管网页客户端
- 启动端口改为动态分配，避免固定端口冲突。
- `Mahjong-AI` 网页端支持 URL 注入参数并自动连接（username/host/port/autoconnect）。

### 1.2 对战页面与交互

- 对战页已简化：
  - 只保留核心游戏画面
  - 左上角为嵌入式浮动按钮（`结束游戏`）
  - 支持全屏按钮（Esc 可退出全屏）
- 游戏画面区域已放大，尽量铺满可视区域。

### 1.3 AI 难度切换（新增）

- 对战入口可选 AI 难度：
  - `普通`：不加载 `Mahjong-AI/model/saved` 权重
  - `进阶`：加载 `Mahjong-AI/model/saved` 权重
- 实现方式：
  - API 增加 `ai_level`
  - 启动 `Mahjong-AI` 时根据难度传参（`--disable_ai_models`）
  - 进阶模式会检查权重是否存在

### 1.4 对局记录与复盘入口

- 每次对战会创建 `Match`，并采集事件到 `MatchEvent`。
- 每盘结束后可在对战页直接看到：
  - `立即复盘`
  - `导出对局文件`
- 支持导出 JSONL 事件流。

### 1.5 复盘链路现状（重要）

- 复盘仍走 `services/api` 内任务系统（不是独立 `services/review-worker` 实现）。
- 当前策略是：
  1. 优先尝试真实引擎复盘（Mortal）
  2. 引擎环境缺失时自动 fallback，保证任务可完成
- 报告标题已修复为优先显示真实用户名（不是 actor `0`）。

---

## 2. 目录与服务关系

- `MahjongLab_v2/apps/web`：前端（Vite + React）
- `MahjongLab_v2/services/api`：后端 API（FastAPI）
- `Mahjong-AI`：被启动的对战引擎与网页客户端

当前默认联调地址：

- 前端: `http://127.0.0.1:5173`
- 后端: `http://127.0.0.1:8001`

---

## 3. 首次启动步骤

## 3.1 启动后端

在 `MahjongLab_v2/services/api` 下运行：

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

健康检查：

```powershell
python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8001/api/health').read().decode())"
```

预期：

```json
{"status":"ok"}
```

## 3.2 启动前端

在 `MahjongLab_v2/apps/web` 下运行：

```powershell
npm run dev
```

打开：

`http://127.0.0.1:5173`

---

## 4. 如何验证对战链路

1. 首页进入 `对战入口`
2. 输入用户名，选择难度（普通/进阶）
3. 点击 `开始对局`
4. 进入游戏页后检查：
   - 左上角浮动 `结束游戏`
   - 可点击全屏
5. 完成一盘后应出现：
   - `立即复盘`
   - `导出对局文件`

---

## 5. 如何验证复盘链路

1. 在对战页点击 `立即复盘`
2. 跳转 `review/task/:taskId`
3. 任务完成后进入 `review/report/:reportId`
4. 报告标题应显示用户名（非 `0`）

---

## 6. 进阶难度的权重要求

进阶模式默认读取 `Mahjong-AI/model/saved` 下权重，例如：

- `discard-model/best.pt`
- `riichi-model/best.pt`
- `chi-model/best.pt`
- `pon-model/best.pt`
- `kan-model/best.pt`

如果这些文件缺失，进阶模式会在创建对局时报错。

---

## 7. Mortal 真实引擎复盘环境（可选）

如果要稳定使用真实引擎复盘（非 fallback），需要额外准备：

- `Mortal/mortal/config.toml`
- `Mortal/mortal/libriichi.pyd`（Windows）
- 可用的 `.pth` 权重
- Rust/cargo（用于相关工具链）

如果没配齐，任务仍可通过 fallback 完成，但分析深度会下降。

---

## 8. 常见故障排查

## 8.1 对战页空白或连接失败

- 检查后端健康接口
- 查看 `services/api/data/play_launcher/*.log`
- 确认 `Mahjong-AI/.venv`、`python.exe`、`websockify.exe` 存在

## 8.2 进阶模式无法启动

- 检查 `Mahjong-AI/model/saved/**/best.pt` 是否齐全

## 8.3 复盘任务失败

- 先看任务错误信息（`review/task` 页面）
- 若是引擎环境问题，默认会走 fallback；若未 fallback，检查 `services/api` 日志

---

## 9. 给后续开发者的建议

- 新功能优先加在 `services/api` + `apps/web`，这是当前主线实现区。
- 对战相关改动主要在：
  - `services/api/app/play_launcher.py`
  - `apps/web/src/app/pages/play/*`
- 复盘相关改动主要在：
  - `services/api/app/review_engine.py`
  - `services/api/app/jobs.py`
  - `apps/web/src/app/pages/review/*`

