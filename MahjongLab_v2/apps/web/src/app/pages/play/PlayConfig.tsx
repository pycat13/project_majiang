import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Bot, ExternalLink, LoaderCircle, PlayCircle, Server } from "lucide-react";

import { createPlaySession } from "../../lib/api";
import { ApiError } from "../../lib/api";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export function PlayConfig() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User1");
  const [aiLevel, setAiLevel] = useState<"normal" | "hard">("normal");
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartGame = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage("请输入用户名后再开始对局。");
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const session = await createPlaySession({ username: trimmedUsername, ai_level: aiLevel });
      navigate(`/play/game/${session.session_id}`, {
        state: { session },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.detail);
      } else {
        setErrorMessage("启动 Mahjong-AI 失败，请确认本机依赖和端口状态。");
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (isStarting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15">
            <LoaderCircle className="h-7 w-7 animate-spin text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">正在启动对局</h1>
          <p className="mt-3 text-sm text-slate-300">
            正在拉起 `Mahjong-AI` 服务并准备对战页面，请稍候...
          </p>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left text-sm text-slate-400">
            <div>用户名：{username.trim() || "未填写"}</div>
            <div className="mt-1">AI 难度：{aiLevel === "hard" ? "进阶" : "普通"}</div>
            <div className="mt-1">流程：启动服务 - 建立连接 - 进入对局页</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 ml-4">创建对战房间</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>启动本地对战</CardTitle>
              <CardDescription>
                MahjongLab 会通过后端拉起 `Mahjong-AI` 的对战服务，并把对战页接到当前平台中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="例如 User1"
                    maxLength={32}
                  />
                  <p className="text-sm text-slate-500">
                    该用户名会自动传给 `Mahjong-AI` 的对战页，进入后无需再重复输入。
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label>AI 难度</Label>
                    <Select value={aiLevel} onValueChange={(value) => setAiLevel(value as "normal" | "hard")}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择难度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">普通</SelectItem>
                        <SelectItem value="hard">进阶</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                    <Server className="h-4 w-4" />
                    启动内容
                  </div>
                  <div>1. `Mahjong-AI` 对战服务 `127.0.0.1:9999`</div>
                  <div>2. WebSocket 桥接 `127.0.0.1:8888`</div>
                  <div>3. 网页客户端 `http://127.0.0.1:8080/index.html`</div>
                </div>
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>启动失败</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Bot className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-900">固定对战形态</div>
                        <div className="mt-1 text-sm text-slate-600">
                          当前接入的是 `3 AI + 1 人类玩家` 的本地 Riichi Mahjong 对战。
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <ExternalLink className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-900">进入方式</div>
                        <div className="mt-1 text-sm text-slate-600">
                          启动后会在 MahjongLab 的对战页内嵌承载，并提供新窗口打开入口。
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t">
                <Button
                  onClick={handleStartGame}
                  className="flex-1"
                  size="lg"
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      正在启动
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      开始对局
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" className="flex-1 w-full" size="lg">
                  <Link to="/">
                    取消
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
