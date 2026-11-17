# 星野优选 ERP · 前端脚手架

多渠道零售企业 ERP 系统的前端基础框架，供三人小组并行开发使用。

**目的只有一个：让三个人写出来的页面长得一样。**

---

## 一、环境要求

| 项 | 版本 |
|---|---|
| Node.js | ≥ 18（推荐 20 / 22） |
| npm | ≥ 9 |

## 二、启动

```bash
npm install      # 首次
npm run dev      # 开发，默认 http://localhost:5173
npm run build    # 打包，产物在 dist/
```

## 三、技术栈

- Vue 3（`<script setup>` 语法）
- Vite 5
- Vue Router 4（hash 模式，无需服务端配置）
- Pinia（状态管理，当前仅留位置）
- Element Plus（**所有 UI 组件只能用它**）
- 原生 CSS（不使用 Tailwind / Sass，避免每人一套写法）

## 四、目录结构

```
src/
├─ api/                 接口层
│  ├─ request.js        统一请求封装（fetch）
│  └─ index.js          接口清单，当前返回 mock
├─ mock/                模拟数据（接后端后整体删除）
├─ components/          全局公共组件
│  ├─ PageHeader.vue    页面标题 + 右侧操作区
│  ├─ StatCard.vue      指标卡
│  └─ TrendChart.vue    折线图（纯 SVG）
├─ layouts/
│  └─ MainLayout.vue    整体框架：侧边栏 + 顶栏 + 内容区
├─ router/index.js      路由表
├─ styles/index.css     全局变量与通用类
├─ views/               页面，按模块分目录
│  ├─ dashboard/        数据看板
│  ├─ order/            订单管理
│  ├─ inventory/        仓储管理
│  ├─ purchase/         采购管理
│  ├─ aftersale/        售后管理
│  ├─ finance/          财务管理
│  └─ system/           系统设置
└─ main.js
```

## 五、开发约定（重要）

### 1. 新建页面固定用这个骨架

```vue
<template>
  <div>
    <PageHeader title="页面名" sub="一句话说明">
      <el-button size="small">次要操作</el-button>
      <el-button size="small" type="primary">主要操作</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head"><h3>区块标题</h3></div>
      <el-table :data="rows" size="small"> ... </el-table>
    </div>
  </div>
</template>
```

**不要自己写外层容器、不要自己定页面内边距**，`MainLayout` 已经处理了。

### 2. 只用这些全局类

| 类名 | 用途 |
|---|---|
| `.card` / `.card-head` | 白色卡片与标题条 |
| `.grid .grid-5` / `.grid-2` / `.grid-3` | 页面栅格 |
| `.num` | 数字右对齐 |
| `--blue / --green / --amber / --red` | 状态色（CSS 变量） |

需要新样式时，写在组件内的 `<style scoped>`，**不要写全局样式**，避免互相覆盖。

### 3. 颜色只用四种语义色

- `--blue` 主色 / 正常
- `--green` 成功 / 正向
- `--amber` 警告 / 待处理
- `--red` 异常 / 负向

禁止引入其他颜色。图表配色从 `mock/dashboard.js` 的 `color` 字段取，保证渠道颜色全站一致。

### 4. 数据一律走 api 层

```js
import { getDashboard } from '@/api'
const data = await getDashboard()
```

**不要在组件里直接 import mock 文件。** 后端就绪后只改 `api/index.js` 一行，页面不用动。

### 5. 表格规范

- 统一 `size="small"`
- 金额、数量列必须加 `align="right"`，并在外层加 `class="num"` 保持等宽数字
- 空值显示 `—`，不显示 `0`，不显示空白
- 分页统一 `layout="total, sizes, prev, pager, next"`

### 6. 命名

| 对象 | 规则 | 示例 |
|---|---|---|
| 页面目录 | kebab-case | `finance/reconciliation` |
| 组件文件 | PascalCase | `StatCard.vue` |
| 变量/函数 | camelCase | `orderList`、`loadData` |
| 常量 | UPPER_SNAKE | `MAX_PAGE_SIZE` |

## 六、分工建议

| 分组 | 负责模块 | 目录 |
|---|---|---|
| A 组 | 订单、售后 | `views/order`、`views/aftersale` |
| B 组 | 仓储、采购 | `views/inventory`、`views/purchase` |
| C 组 | 财务、系统设置、看板 | `views/finance`、`views/system`、`views/dashboard` |

**每个人只改自己目录下的文件**；`components/`、`styles/`、`router/` 由组长统一维护。

## 七、Git 约定

分支：

```
main        可运行版本，只接受合并
dev         日常集成分支
feat/模块名  个人开发分支，如 feat/order
```

提交信息：

```
feat(order): 新增订单列表分页
fix(inventory): 修复库存数量显示为 0 的问题
docs: 补充接口约定
```

**每天推送前先 `git pull --rebase`，避免合并冲突。**

## 八、待办

- [ ] 后端接口接入（替换 `api/index.js` 中的 mock）
- [ ] 登录页与路由守卫
- [ ] Pinia 用户状态与权限指令
- [ ] 各模块页面按 PRD 填充
