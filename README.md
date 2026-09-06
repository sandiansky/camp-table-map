# 营地桌位地图（Camp Table Map）

一个移动端优先的营地桌位管理工具，用来维护“桌号 → 当前实际位置”。不接入点餐平台、不需要账号或后端，数据保存在当前浏览器中。

## 功能

- 片区新建、修改、删除、排序
- 桌位单个/批量创建，支持圆桌、方桌、长桌
- 编辑模式拖动桌位，查看模式拖动画布、双指缩放
- 全营地桌号搜索，自动进入片区、居中并高亮桌位
- 上传并压缩片区背景图，设置透明度和显隐
- 房子、树木、石头、帐篷、围栏等固定物，可调整名称、大小和位置
- 独立桌位库，按桌号首字符自动分组并可快速定位
- 2 倍清晰度 PNG 导出和系统图片分享
- 布局模板保存与恢复
- JSON 数据备份、导入、统计和清空
- localStorage 自动保存，刷新不丢失
- PWA，可添加到手机主屏幕并离线打开

## 本地运行

需要 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

终端会显示本地地址。在同一 Wi-Fi 下可使用 Vite 的网络地址在手机测试；也可以运行 `npm run dev -- --host`。

## 构建

```bash
npm run build
npm run preview
```

构建文件输出到 `dist/`。Vite 默认使用相对资源路径，因此可部署在 GitHub Pages 的项目子路径下。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库并推送本项目。
2. 安装依赖：`npm install`。
3. 运行：

```bash
npm run deploy
```

该命令会先构建，再使用 `gh-pages` 将 `dist/` 发布到 `gh-pages` 分支。在仓库 **Settings → Pages** 中选择 **Deploy from a branch**，分支选 `gh-pages`，目录选 `/ (root)`。

如需明确指定仓库子路径，也可以在构建时设置 `VITE_BASE_PATH`，例如 PowerShell：

```powershell
$env:VITE_BASE_PATH='/camp-table-map/'; npm run deploy
```

## 数据与隐私

所有数据（包括压缩后的背景图片）只保存在浏览器的 localStorage 中，不会上传服务器。清理浏览器数据会删除地图，建议在设置页定期导出 `camp-table-backup.json`。不同浏览器或设备的数据不会自动同步，可用导入/导出迁移。

## 项目结构

```text
src/
  components/   通用弹层与搜索组件
  pages/        首页、地图页、设置页
  store/        localStorage 数据状态
  types/        TypeScript 数据模型
  utils/        图片压缩、示例数据与 ID 工具
```
