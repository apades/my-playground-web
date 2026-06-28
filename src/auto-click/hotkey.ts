import koffi from 'koffi'

const user32 = koffi.load('user32.dll')
const kernel32 = koffi.load('kernel32.dll')

const GetAsyncKeyState = user32.func('GetAsyncKeyState', 'int16', ['int'])
const GetModuleHandleW = kernel32.func('GetModuleHandleW', 'void *', ['str16'])
const SetWindowsHookExW = user32.func(
  'void * __stdcall SetWindowsHookExW(int idHook, void *lpfn, void *hmod, uint32 dwThreadId)',
)
const CallNextHookEx = user32.func(
  'intptr __stdcall CallNextHookEx(void *hhk, int nCode, uintptr_t wParam, void *lParam)',
)
const UnhookWindowsHookEx = user32.func(
  'bool __stdcall UnhookWindowsHookEx(void *hhk)',
)

const MSG = koffi.struct('MSG', {
  hwnd: 'void *',
  message: 'uint32',
  wParam: 'uintptr_t',
  lParam: 'intptr_t',
  time: 'uint32',
  pt: koffi.struct({ x: 'long', y: 'long' }),
})

const KBDLLHOOKSTRUCT = koffi.struct('KBDLLHOOKSTRUCT', {
  vkCode: 'uint32',
  scanCode: 'uint32',
  flags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr_t',
})

const LowLevelKeyboardProc = koffi.proto(
  'intptr __stdcall LowLevelKeyboardProc(int nCode, uintptr_t wParam, void *lParam)',
)

const PeekMessageW = user32.func(
  'bool __stdcall PeekMessageW(_Out_ MSG *lpMsg, void *hWnd, uint32 wMsgFilterMin, uint32 wMsgFilterMax, uint32 wRemoveMsg)',
)

const VK_CONTROL = 0x11
const VK_LCONTROL = 0xa2
const VK_RCONTROL = 0xa3
export const VK_F9 = 0x78
export const VK_F10 = 0x79
export const VK_F11 = 0x7a

export const HOTKEY_CAPTURE = 1
export const HOTKEY_START = 2
export const HOTKEY_STOP = 3

const WH_KEYBOARD_LL = 13
const WM_KEYDOWN = 0x0100
const WM_SYSKEYDOWN = 0x0104
const WM_KEYUP = 0x0101
const WM_SYSKEYUP = 0x0105
const PM_REMOVE = 0x0001

const comboState = { f9: false, f10: false, f11: false }

let useHook = false
let hookHandle: unknown = null
let pendingHotkey: number | null = null
let ctrlDown = false
let hookProcRef: unknown = null

function isCtrlKey(vk: number): boolean {
  return vk === VK_CONTROL || vk === VK_LCONTROL || vk === VK_RCONTROL
}

function isKeyDown(vk: number): boolean {
  return (GetAsyncKeyState(vk) & 0x8000) !== 0
}

function isComboDown(vk: number): boolean {
  return isKeyDown(VK_CONTROL) && isKeyDown(vk)
}

function queueHotkey(id: number, key: 'f9' | 'f10' | 'f11'): void {
  if (!comboState[key]) {
    pendingHotkey = id
  }
  comboState[key] = true
}

function handleHookKey(vk: number, isDown: boolean): void {
  if (isCtrlKey(vk)) {
    ctrlDown = isDown
    return
  }

  if (vk === VK_F9) {
    if (isDown && ctrlDown) queueHotkey(HOTKEY_CAPTURE, 'f9')
    else if (!isDown) comboState.f9 = false
    return
  }

  if (vk === VK_F10) {
    if (isDown && ctrlDown) queueHotkey(HOTKEY_START, 'f10')
    else if (!isDown) comboState.f10 = false
    return
  }

  if (vk === VK_F11) {
    if (isDown && ctrlDown) queueHotkey(HOTKEY_STOP, 'f11')
    else if (!isDown) comboState.f11 = false
  }
}

function pollAsyncHotkey(): number | null {
  const combos = [
    [VK_F11, HOTKEY_STOP, 'f11'],
    [VK_F10, HOTKEY_START, 'f10'],
    [VK_F9, HOTKEY_CAPTURE, 'f9'],
  ] as const

  for (const [vk, id, key] of combos) {
    const down = isComboDown(vk)
    if (down && !comboState[key]) {
      comboState[key] = true
      return id
    }
    comboState[key] = down
  }

  return null
}

export function initHotkeys(enableLowLevelHook: boolean): void {
  useHook = enableLowLevelHook
  resetHotkeyState()

  if (!useHook) {
    return
  }

  hookProcRef = koffi.register(
    (nCode: number, wParam: number, lParam: unknown) => {
      if (nCode >= 0) {
        const isDown = wParam === WM_KEYDOWN || wParam === WM_SYSKEYDOWN
        const isUp = wParam === WM_KEYUP || wParam === WM_SYSKEYUP
        if (isDown || isUp) {
          const kb = koffi.decode(lParam, KBDLLHOOKSTRUCT)
          handleHookKey(Number(kb.vkCode), isDown)
        }
      }
      return CallNextHookEx(hookHandle, nCode, wParam, lParam)
    },
    koffi.pointer(LowLevelKeyboardProc),
  )

  const module = GetModuleHandleW(null)
  hookHandle = SetWindowsHookExW(WH_KEYBOARD_LL, hookProcRef, module, 0)

  if (!hookHandle) {
    throw new Error('SetWindowsHookExW failed，无法安装低级键盘钩子')
  }
}

function resetHotkeyState(): void {
  comboState.f9 = false
  comboState.f10 = false
  comboState.f11 = false
  ctrlDown = false
  pendingHotkey = null
}

export function shutdownHotkeys(): void {
  if (hookHandle) {
    UnhookWindowsHookEx(hookHandle)
    hookHandle = null
  }
  hookProcRef = null
  resetHotkeyState()
}

export function pumpHotkeyMessages(): void {
  if (!useHook) {
    return
  }

  const msg = {}
  while (PeekMessageW(msg, null, 0, 0, PM_REMOVE)) {
    // 消息泵：低级键盘钩子依赖线程处理消息队列
  }
}

export function pollHotkey(): number | null {
  if (useHook) {
    const hotkey = pendingHotkey
    pendingHotkey = null
    return hotkey
  }

  return pollAsyncHotkey()
}

export function isUsingLowLevelHook(): boolean {
  return useHook
}
