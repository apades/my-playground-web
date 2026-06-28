# auto-click

Windows 下的 Node.js 小工具，通过 [koffi](https://koffi.dev/) 调用 `user32.dll`，模拟鼠标右键点击。当前阶段使用**控制台**展示 UI 和运行状态。

> 仅支持 Windows。本目录是 playground 仓库内的**独立子项目**，有自己的 `package.json` 和依赖。

## 功能

| 快捷键      | 作用                                                        |
| ----------- | ----------------------------------------------------------- |
| **Ctrl+F9** | 捕获当前鼠标屏幕坐标 |
| **Ctrl+F10** | 在捕获位置开始重复右键点击（立即点击一次，之后每 1 秒一次） |
| **Ctrl+F11** | 停止重复点击 |

控制台会显示：已捕获坐标、点击状态、最近操作。

## 运行

```powershell
# 在子项目目录
cd src/auto-click
pnpm install
pnpm start

# 或在仓库根目录
pnpm auto-click
```

按 **Ctrl+C** 退出。

## 全屏游戏模式

全屏游戏会独占键盘/鼠标，普通桌面模式可能无效。请使用**游戏模式**：

```powershell
# 子项目目录
pnpm start:game

# 仓库根目录
pnpm auto-click:game
```

### 游戏模式改动

| 项目   | 桌面模式                | 游戏模式 (`--game`)                    |
| ------ | ----------------------- | -------------------------------------- |
| 快捷键 | `GetAsyncKeyState` 轮询 | 低级键盘钩子 `WH_KEYBOARD_LL`          |
| 点击   | `SendInput` 绝对坐标    | `SetCursorPos` 移动光标 + 相对坐标右键 |
| 消息泵 | 无                      | 必须，否则钩子不触发                   |

可选参数：

- `--keep-cursor` — 停止点击后也不恢复光标（默认停止时会恢复到开始点击前的位置）

### 游戏内使用步骤

1. **先启动** auto-click（游戏模式），再进入游戏全屏
2. 切到游戏，将鼠标移到目标位置，按 **Ctrl+F9** 捕获
3. **Ctrl+F10** 开始重复右键，**Ctrl+F11** 停止

### 仍无效时

- 游戏设置改为**无边框窗口**（Borderless Windowed），兼容性最好
- 游戏以管理员运行时，本程序也需**以管理员身份**运行
- 带反作弊的网游可能拦截 `SendInput`，无法绕过

## 项目结构

```
src/auto-click/
├── index.ts      # 入口：控制台 UI、状态管理、快捷键业务逻辑
├── win32.ts      # Win32 API：鼠标点击（桌面/游戏两种策略）
├── hotkey.ts     # 快捷键：轮询 / 低级键盘钩子
├── package.json
├── tsconfig.json
└── README.md
```

## 技术实现

### Win32 API（`win32.ts` / `hotkey.ts`）

- `SendInput` — 桌面模式：绝对坐标右键
- `SetCursorPos` + `SendInput` — 游戏模式：先移动光标再相对坐标点击
- `SetWindowsHookExW(WH_KEYBOARD_LL)` — 游戏模式全局快捷键
- `GetCursorPos` — 获取鼠标位置（出参需标记 `_Out_`）
- `GetAsyncKeyState` — 桌面模式快捷键轮询

### 快捷键方案

- **桌面模式**：`GetAsyncKeyState` 每 50ms 轮询
- **游戏模式**：低级键盘钩子 + 消息泵（`PeekMessageW`）

### 点击逻辑

1. Ctrl+F9 调用 `getCursorPosition()` 保存坐标
2. Ctrl+F10 锁定坐标并启动 `setInterval`
3. 桌面模式：`SendInput` 绝对坐标右键
4. 游戏模式：点击期间光标**始终保持在捕获坐标**，每次仅发送右键；停止时可选恢复光标

## 依赖

- **koffi** — Node.js FFI，加载 `user32.dll`
- **tsx** — 直接运行 TypeScript

首次安装若 pnpm 提示 koffi 的 build script 被忽略，执行 `pnpm approve-builds` 并允许 koffi。

## 已知限制

- 仅 Windows
- 仅右键点击
- 点击间隔固定 1 秒
- 需在终端中运行以查看控制台 UI
