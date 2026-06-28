import koffi from 'koffi'

const user32 = koffi.load('user32.dll')

export const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long',
})

const MOUSEINPUT = koffi.struct('MOUSEINPUT', {
  dx: 'long',
  dy: 'long',
  mouseData: 'uint32',
  dwFlags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr_t',
})

const INPUT = koffi.struct('INPUT', {
  type: 'uint32',
  _: 'uint32',
  dx: 'long',
  dy: 'long',
  mouseData: 'uint32',
  dwFlags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr_t',
})

const INPUT_SIZE = koffi.sizeof(INPUT)

const GetCursorPos = user32.func(
  'bool __stdcall GetCursorPos(_Out_ POINT *pos)',
)
const SetCursorPos = user32.func('bool __stdcall SetCursorPos(int x, int y)')
const GetSystemMetrics = user32.func(
  'int __stdcall GetSystemMetrics(int nIndex)',
)
const SendInput = user32.func(
  'uint32 __stdcall SendInput(uint32 cInputs, INPUT *inputs, int cbSize)',
)

const INPUT_MOUSE = 0
const MOUSEEVENTF_MOVE = 0x0001
const MOUSEEVENTF_RIGHTDOWN = 0x0008
const MOUSEEVENTF_RIGHTUP = 0x0010
const MOUSEEVENTF_ABSOLUTE = 0x8000
const MOUSEEVENTF_VIRTUALDESK = 0x4000

const SM_XVIRTUALSCREEN = 76
const SM_YVIRTUALSCREEN = 77
const SM_CXVIRTUALSCREEN = 78
const SM_CYVIRTUALSCREEN = 79

export type ClickMode = 'desktop' | 'game'

let clickMode: ClickMode = 'desktop'

export function setClickMode(mode: ClickMode): void {
  clickMode = mode
}

export function getClickMode(): ClickMode {
  return clickMode
}

function toAbsoluteCoords(x: number, y: number): { ax: number; ay: number } {
  const vx = GetSystemMetrics(SM_XVIRTUALSCREEN)
  const vy = GetSystemMetrics(SM_YVIRTUALSCREEN)
  const vw = GetSystemMetrics(SM_CXVIRTUALSCREEN)
  const vh = GetSystemMetrics(SM_CYVIRTUALSCREEN)

  return {
    ax: Math.round(((x - vx) * 65535) / Math.max(vw - 1, 1)),
    ay: Math.round(((y - vy) * 65535) / Math.max(vh - 1, 1)),
  }
}

function makeMouseInput(dx: number, dy: number, dwFlags: number) {
  return {
    type: INPUT_MOUSE,
    _: 0,
    dx,
    dy,
    mouseData: 0,
    dwFlags,
    time: 0,
    dwExtraInfo: 0,
  }
}

function sendMouseInputs(inputs: ReturnType<typeof makeMouseInput>[]): void {
  const sent = SendInput(inputs.length, inputs, INPUT_SIZE)
  if (sent !== inputs.length) {
    throw new Error(`SendInput failed: sent ${sent}/${inputs.length}`)
  }
}

export function getCursorPosition(): { x: number; y: number } {
  const point: { x?: number; y?: number } = {}
  if (!GetCursorPos(point)) {
    throw new Error('GetCursorPos failed')
  }
  return { x: point.x ?? 0, y: point.y ?? 0 }
}

export function moveCursorTo(x: number, y: number): void {
  if (!SetCursorPos(x, y)) {
    throw new Error('SetCursorPos failed')
  }
}

export function restoreCursorTo(x: number, y: number): void {
  SetCursorPos(x, y)
}

export function rightClickAtCurrent(): void {
  sendMouseInputs([
    makeMouseInput(0, 0, MOUSEEVENTF_RIGHTDOWN),
    makeMouseInput(0, 0, MOUSEEVENTF_RIGHTUP),
  ])
}

function rightClickDesktop(x: number, y: number): void {
  const { ax, ay } = toAbsoluteCoords(x, y)
  const flags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK

  sendMouseInputs([
    makeMouseInput(ax, ay, MOUSEEVENTF_MOVE | flags),
    makeMouseInput(ax, ay, MOUSEEVENTF_RIGHTDOWN | flags),
    makeMouseInput(ax, ay, MOUSEEVENTF_RIGHTUP | flags),
  ])
}

function rightClickGame(x: number, y: number): void {
  moveCursorTo(x, y)
  rightClickAtCurrent()
}

export function rightClickAt(x: number, y: number): void {
  if (clickMode === 'game') {
    rightClickGame(x, y)
    return
  }

  rightClickDesktop(x, y)
}
