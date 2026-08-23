# Tennis-Data-System-Frontend-Visual-Demo

网球数据系统前端 Demo，包含登录、视频上传、视频管理，以及三套网球视频分析 Web UI 原型。

## Requirements

- Node.js 20 or newer
- pnpm 11.7.0 or newer

## Three UI prototypes

The `webUI` workspace contains the First, Second, and Third prototypes plus their shared `@tennis-ui/core` package.

```powershell
cd C:\Users\28641\Desktop\React\webUI
pnpm install --frozen-lockfile
pnpm dev:first   # http://localhost:5181
pnpm dev:second  # http://localhost:5182
pnpm dev:third   # http://localhost:5183
```

Routes in each prototype:

- `/video/demo-upload-001`
- `/overview`
- `/rally?player=A` or `/rally?player=B`
- `/serve?player=A` or `/serve?player=B`

For deterministic review screenshots, append `?snapshot=1` (and `&time=35000` on the video route).

## Checks

```powershell
pnpm typecheck
pnpm test
pnpm build
```

The `webUI/packages/core` workspace provides the shared fixture, selectors, metrics, evidence, clips, and validators used by all three prototypes.
