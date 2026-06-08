# GitHub 首页增强

适用于 [GitHub](https://github.com) 登录首页的 Tampermonkey / Violentmonkey 用户脚本，将默认首页重排为更清爽的工作台式三栏视图。

## 功能

- **工作台布局**：把 GitHub 首页整理成左侧仓库、中间动态、右侧推荐的三栏结构。
- **仓库入口**：自动读取首页已有仓库列表，保留常用仓库的快速入口。
- **动态时间线**：聚合 GitHub 首页动态，并尝试补充仓库真实活动。
- **动态筛选**：支持在「所有动态」和「我的动态」之间切换。
- **推荐内容**：保留相关用户、相关仓库和 GitHub 常用入口。
- **中英文适配**：根据 GitHub 页面语言自动显示中文或英文文案。
- **低侵入**：仅在 GitHub 登录首页和 `/dashboard` 生效，不修改仓库、Issues、PR 等页面。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或兼容的用户脚本管理器。
2. 从 Greasy Fork（油叉）安装，或安装 GitHub 开发版：

```text
https://github.com/zhuxiongkai/github-home-enhancer/raw/main/github-home-enhancer.user.js
```

3. 打开 [GitHub 首页](https://github.com/) 并保持登录状态。

## 使用说明

| 场景 | 操作 |
|------|------|
| 查看增强首页 | 打开 `https://github.com/` 或 `https://github.com/dashboard` |
| 查看全部动态 | 在动态标题右侧选择「所有动态」 |
| 只看自己的动态 | 在动态标题右侧选择「我的动态」 |
| 打开仓库 / 用户 / 动态 | 直接点击对应链接 |
| 暂停脚本 | 在脚本管理器中禁用本脚本 |

## 隐私说明

- 脚本只在 `github.com` 页面运行。
- 脚本会读取当前 GitHub 首页中已经渲染的仓库、用户和动态信息。
- 为补充动态，脚本会请求 GitHub 自身页面或公开 API，例如 `github.com/.../activity` 和 `api.github.com/repos/.../events`。
- 脚本不向第三方服务器发送数据。
- 脚本不使用远程统计、不写入外部数据库，也不保存个人数据。

## 兼容性

- 支持 Chrome / Edge / Firefox 等现代浏览器。
- 推荐使用 Tampermonkey 或 Violentmonkey。
- GitHub 页面结构变化可能导致部分区域失效，遇到问题请提交 Issue。

## 开发

```bash
npm test
```

测试会检查 userscript 元信息、关键文案、核心函数和语法合法性。

## 许可证

[MIT](LICENSE)

## 作者

- [zhuxiongkai](https://github.com/zhuxiongkai)

## 支持作者

如果这个脚本对你有帮助，可以在 [爱发电](https://ifdian.net/a/zhuxk2005) 支持一下作者。

## 反馈

请在 [Issues](https://github.com/zhuxiongkai/github-home-enhancer/issues) 提交问题或建议。
