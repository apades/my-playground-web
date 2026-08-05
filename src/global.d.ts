declare module '*.png' {
  const url: string
  export default url
}

declare module '*.css' {
  const css: string
  export default css
}

declare module '*.less' {
  const css: string
  export default css
}

declare module '*?raw' {
  const text: string
  export default text
}

declare module '*?inline' {
  const text: string
  export default text
}

declare module '*?url' {
  const url: string
  export default url
}
