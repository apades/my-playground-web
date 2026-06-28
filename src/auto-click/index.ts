import {
  HOTKEY_CAPTURE,
  HOTKEY_START,
  HOTKEY_STOP,
  initHotkeys,
  pollHotkey,
  pumpHotkeyMessages,
  shutdownHotkeys,
} from './hotkey.js'
import {
  getCursorPosition,
  getClickMode,
  moveCursorTo,
  restoreCursorTo,
  rightClickAt,
  rightClickAtCurrent,
  setClickMode,
} from './win32.js'

type Position = { x: number; y: number }

const gameMode = process.argv.includes('--game')
const keepCursor = process.argv.includes('--keep-cursor')

let capturedPosition: Position | null = null
let clickTimer: ReturnType<typeof setInterval> | null = null
let isClicking = false
let cursorBeforeSession: Position | null = null
let lastAction = gameMode ? '游戏模式已启动' : '程序已启动'

function renderUI(): void {
  console.clear()
  console.log('╔══════════════════════════════════════╗')
  console.log('║         Auto Click (Windows)         ║')
  console.log('╚══════════════════════════════════════╝')
  console.log('')
  console.log(
    `  运行模式: ${getClickMode() === 'game' ? '游戏 (全屏)' : '桌面'}`,
  )
  console.log(
    `  鼠标位置: ${
      capturedPosition
        ? `(${capturedPosition.x}, ${capturedPosition.y})`
        : '未捕获'
    }`,
  )
  console.log(
    `  点击状态: ${isClicking ? '运行中 (每 1 秒右键点击)' : '已停止'}`,
  )
  console.log(`  最近操作: ${lastAction}`)
  console.log('')
  console.log('  快捷键:')
  console.log('    Ctrl+F9   捕获当前鼠标位置')
  console.log('    Ctrl+F10  开始重复点击')
  console.log('    Ctrl+F11  停止重复点击')
  console.log('')
  if (gameMode) {
    console.log('  游戏模式提示:')
    console.log('    - 使用低级键盘钩子，全屏游戏中也可响应快捷键')
    console.log('    - 点击期间光标保持在捕获位置，不会跳回 (0,0)')
    console.log('    - 停止时默认恢复光标；加 --keep-cursor 则保持不动')
    console.log('    - 若无效：游戏改无边框窗口，或以管理员身份运行本程序')
    console.log('')
  }
  console.log('  按 Ctrl+C 退出')
}

function capturePosition(): void {
  if (isClicking) {
    lastAction = '点击进行中，请先 Ctrl+F11 停止后再捕获'
    renderUI()
    return
  }

  capturedPosition = getCursorPosition()
  lastAction = `已捕获位置 (${capturedPosition.x}, ${capturedPosition.y})`
  renderUI()
}

function startClicking(): void {
  if (isClicking) {
    lastAction = '点击已在运行中'
    renderUI()
    return
  }

  if (!capturedPosition) {
    lastAction = '请先按 Ctrl+F9 捕获鼠标位置'
    renderUI()
    return
  }

  const targetPosition = {
    x: capturedPosition.x,
    y: capturedPosition.y,
  }
  isClicking = true
  lastAction = `开始重复点击 (${targetPosition.x}, ${targetPosition.y})`

  if (gameMode) {
    cursorBeforeSession = getCursorPosition()
    moveCursorTo(targetPosition.x, targetPosition.y)
  }

  const click = () => {
    try {
      if (gameMode) {
        moveCursorTo(targetPosition.x, targetPosition.y)
        rightClickAtCurrent()
      } else {
        rightClickAt(targetPosition.x, targetPosition.y)
      }
    } catch (error) {
      stopClicking()
      lastAction = `点击失败: ${error instanceof Error ? error.message : String(error)}`
      renderUI()
    }
  }

  click()
  clickTimer = setInterval(click, 1000)
  renderUI()
}

function stopClicking(): void {
  if (clickTimer) {
    clearInterval(clickTimer)
    clickTimer = null
  }

  if (isClicking) {
    lastAction = '已停止重复点击'
  } else {
    lastAction = '当前未在点击'
  }

  if (cursorBeforeSession && !keepCursor) {
    const { x, y } = cursorBeforeSession
    if (x !== 0 || y !== 0) {
      restoreCursorTo(x, y)
    }
  }
  cursorBeforeSession = null

  isClicking = false
  renderUI()
}

function handleHotkey(id: number): void {
  switch (id) {
    case HOTKEY_CAPTURE:
      capturePosition()
      break
    case HOTKEY_START:
      startClicking()
      break
    case HOTKEY_STOP:
      stopClicking()
      break
  }
}

function cleanup(): void {
  stopClicking()
  shutdownHotkeys()
  console.log('\n已退出')
}

function main(): void {
  if (gameMode) {
    setClickMode('game')
  }

  initHotkeys(gameMode)
  renderUI()

  const pollTimer = setInterval(() => {
    pumpHotkeyMessages()
    const hotkeyId = pollHotkey()
    if (hotkeyId !== null) {
      handleHotkey(hotkeyId)
    }
  }, 50)

  process.on('SIGINT', () => {
    clearInterval(pollTimer)
    cleanup()
    process.exit(0)
  })

  process.on('exit', () => {
    clearInterval(pollTimer)
    shutdownHotkeys()
  })
}

main()
