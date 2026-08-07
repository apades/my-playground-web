import isEqual from './feat/fast-deep-equal'

export type noop = (this: any, ...args: any[]) => any

export function tryCatch<Return>(
  fn: () => Return,
): Return extends Promise<any>
  ? Promise<[undefined, Awaited<Return>] | [Error, undefined]>
  : [undefined, Return] | [Error, undefined] {
  try {
    const rs: any = fn()
    if (rs instanceof Promise) {
      return rs
        .then((d) => [undefined, d])
        .catch((err) => [err, undefined]) as any
    } else {
      return [undefined, rs] as any
    }
  } catch (error) {
    return [error as Error, undefined] as any
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isAsyncFunction(fn: Function): boolean {
  return (
    (fn as any).__proto__.constructor ==
    'function AsyncFunction() { [native code] }'
  )
}

export function onceCall<T extends noop>(fn: T): T {
  if (isAsyncFunction(fn)) return oncePromise(fn)
  let rs: any
  let lastArgs: any
  let hasCall = false
  let err: any = null

  return ((...args: any[]) => {
    if (!hasCall || !isEqual(args, lastArgs) || err) {
      hasCall = true
      ;[err, rs] = tryCatch(() => (fn as (...args: any[]) => {})(...args))
    }
    lastArgs = args
    return rs as ReturnType<typeof fn>
  }) as T
}

export function oncePromise<T extends noop>(fn: T): T {
  let promise: Promise<any>
  let lastArgs: any
  let isErr = false

  return ((...args: any[]) => {
    if (!promise || !isEqual(args, lastArgs) || isErr) {
      promise = new Promise((res, rej) => {
        fn(...args)
          .then((e: any) => {
            res(e)
            isErr = false
          })
          .catch((e: any) => {
            rej(e)
            isErr = true
          })
      })
    }
    lastArgs = args
    return promise
  }) as T
}
