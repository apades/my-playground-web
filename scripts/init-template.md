# init-template：Vite Demo 脚手架

## 作用

`scripts/init-template.ts` 在**空文件夹**中自动生成一个最小 Vite + React demo，包含 3 个文件：

| 文件         | 说明                                          |
| ------------ | --------------------------------------------- |
| `App.tsx`    | 根组件，组件名与展示文案均来自文件夹名        |
| `index.html` | 入口 HTML，`<title>` 为文件夹名               |
| `index.tsx`  | React 挂载脚本，导入并渲染 `App.tsx` 中的组件 |

生成内容中的**名称与当前文件夹名绑定**：展示用原始文件夹名（如 `my-cool-demo`），React 组件名转为 PascalCase（如 `MyCoolDemo`）。

## 如何运行

通过根目录 `package.json` 的 `init` 脚本执行：

```bash
pnpm run init
```

**必须在目标空文件夹内**先 `cd`，再执行上述命令。pnpm 会在 package 根目录跑脚本，因此脚本使用环境变量 `INIT_CWD`（用户执行 `pnpm run init` 时的工作目录）作为写入目标，而不是 `process.cwd()`。

示例：

```bash
mkdir demos/my-feature
cd demos/my-feature
pnpm run init
```

成功后当前目录会出现 `App.tsx`、`index.html`、`index.tsx`。

## 命名规则

- **文件夹名** → 页面标题、`<h1>` 文案、错误信息等（原样使用）
- **组件名** → 对文件夹名按 `-`、`_`、空格分词后转 PascalCase  
  - 例：`my-cool-demo` → 组件 `MyCoolDemo`

## 约束与校验

1. 目标目录必须为空（存在任意文件/子目录即失败，`node_modules` 除外）
2. 文件夹名须能解析出以字母开头的合法 React 组件名（建议使用字母、数字、`-`、`_`）
3. 无法从路径解析有效文件夹名时会退出并提示先 `cd` 到目标目录

## 与项目其他部分的关系

- 依赖仓库根目录已安装的 `react`、`react-dom`、`vite`（demo 文件本身不单独装包）
- `App.tsx` 使用了项目 `tailwind.config.ts` 中的工具类 `f-center`（需配合根目录 Tailwind / Vite 配置使用）
- **不会**生成 `vite.config.ts`、`package.json` 等；仅上述 3 个文件
- 修改生成逻辑时，请同步更新本文档

## 相关文件

- 脚本：`scripts/init-template.ts`
- 命令：`package.json` → `"init": "tsx scripts/init-template.ts"`
