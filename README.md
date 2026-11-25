# 星野优选 ERP

多渠道零售企业 ERP 前端。模块与字段严格按《ERP 功能架构》（Map1.pdf）与《erpPRD》实现。

---

## 一、启动

**方式一：一键启动（推荐）**

双击 `启动系统.bat` —— 自动开后端 + 前端。

**方式二：手动**

```bash
# 1. 后端（先确保本地 MySQL 已启动）
cd server
npm install
npm start          # http://localhost:3001

# 2. 前端（另开一个终端）
npm install
npm run dev        # http://localhost:5173
```

> 后端连不上时前端会直接停在「数据库连接失败」页，不会静默降级。

## 二、数据库

本地 MySQL 8.0，库名 `erp_xingye`，首次启动自动建库建表。

| 配置 | 默认值 | 覆盖方式 |
|---|---|---|
| 主机 | 127.0.0.1:3306 | 环境变量 `DB_HOST` / `DB_PORT` |
| 账号 | root / 123456 | `DB_USER` / `DB_PASSWORD` |
| 库名 | erp_xingye | `DB_NAME` |
| 接口 | http://localhost:3001 | 前端 `VITE_API_BASE` |

**表结构（8 张）**

| 表 | 说明 |
|---|---|
| `orders` | 订单主表 |
| `order_goods` | 订单商品明细（一单多行） |
| `aftersales` | 售后工单 |
| `purchase_orders` | 采购单主表 |
| `purchase_items` | 采购货品明细 |
| `stock_items` | 库存（货品编码 + 仓库唯一） |
| `stock_moves` | 库存出入库流水 |
| `users` | 账号 |

建表语句见 `server/sql/schema.sql`。

**数据怎么流转**

```
启动 → GET /api/bootstrap → 覆盖前端内存数组 → 页面渲染
改动 → 防抖 900ms → PUT /api/bootstrap → 事务整表替换
```

首次启动若库为空，会把前端种子数据自动灌入，之后一律以数据库为准。

## 三、登录

打开后先进登录页，账号密码见登录页底部的「演示账号」（初始密码统一 `Xy@2026`），点任意一行可自动填充。

| 账号 | 姓名 | 职位 |
|---|---|---|
| demo | 演示 | 全局演示（全部页面与操作，会议演示用） |
| genziyi | 耿子毅 | 财务 |
| wangjl | 王佳丽 | 运营 |
| lilx | 李丽霞 | 仓管 |
| zhangls | 张丽珊 | 售后 |
| sysadmin | 管理员 | 系统管理员 |
| qitian | 齐田 | 老板 |

未登录访问任何页面都会跳回登录页；顶栏头像可退出登录。

## 三、技术栈

Vue 3（`<script setup>`）+ Vite 5 + Vue Router 4 + Pinia + Element Plus。
Element Plus 主题已按原型配色改写（主色 `#169BD5`），见 `src/styles/theme.css`。

## 四、目录

```
src/
├─ layouts/MainLayout.vue     侧边栏 + 顶栏 + 内容区
├─ components/
│  ├─ PageHeader.vue          页面标题 + 右侧操作
│  └─ TablePage.vue          通用列表页（筛选 / 搜索 / 表格）
├─ router/index.js            22 个页面路由
├─ styles/theme.css           原型配色与全局类
├─ utils/format.js            金额、剩余时间格式化
└─ views/
   ├─ dashboard/              数据看板
   ├─ order/list.vue          订单审核 / 待发货 / 已发货 / 已完结（props 复用）
   ├─ purchase/               采购订单（列表）· 新建采购单 · 供应商管理
   ├─ inventory/              库存记录 · 库存盘点
   ├─ aftersale/list.vue      售后待处理 / 处理中 / 处理完成（props 复用）
   ├─ finance/                对账中心 · 发货数据 · 商品信息 · 库存积压 · 应付账款台账
   └─ system/                 职位管理 · 账号管理 · 权限管理 · 发货仓设置
```

## 五、模块与页面（对应功能架构）

| 模块 | 页面 |
|---|---|
| 数据看板 | 经营数据看板（GMV、订单量、毛利、库存积压、待处理差异） |
| 订单管理 | 订单审核、待发货、已发货、已完结 |
| 采购管理 | 采购订单（列表 + 审批弹窗 + 供应商抽屉）、新建采购单、供应商管理 |
| 库存管理 | 库存记录（设置预警）、库存盘点（创建盘点任务） |
| 售后管理 | 售后待处理、售后处理中、售后处理完成 |
| 财务管理 | 对账中心、发货数据、商品信息、库存积压、应付账款台账 |
| 系统设置 | 职位管理、账号管理、权限管理、发货仓设置 |

**页面 → 按钮 → 权限点** 的完整对照表见 `docs/页面与按钮清单.md`（7 模块 / 22 页面 / 88 权限点）。
改按钮时三处必须同步：页面 `v-can`、`src/data/perm.js`、该对照表；`system.js` 只存职位与账号，
不再维护第二份按钮清单。

## 六、开发约定

### 1. 列表页一律用 TablePage

```vue
<TablePage title="库存记录" sub="货品批次库存" :columns="columns" :rows="rows"
  :filters="filters" :search-keys="['name','code']" />
```

列类型：`text` / `num` / `money` / `tag` / `index` / `timeLeft`。
**不要每个页面自己写一遍筛选区和表头**，那正是风格跑偏的源头。

> 例外：采购管理与库存管理两组页面已按原型（`原型图_RP11.rp`）重做，带指标卡 + 操作列 + 弹窗，
> 不再走 `TablePage`。复用件为 `components/StatCards.vue`、
> `components/purchase/SupplierPanel.vue`（抽屉与独立页共用）、`components/purchase/GoodsPicker.vue`。

### 2. 状态型页面只写一个组件

订单四个状态、售后三个状态，都是同一张表换筛选。
用 `props.status` 区分，**不要复制页面**：

```js
{ path: 'order/pending', component: () => import('@/views/order/list.vue'),
  props: { status: 'pending' } }
```

### 3. 颜色只用 theme.css 里的变量

`--brand` `--ok` `--warn` `--danger` `--ink` `--ink-2` `--ink-3`。
不要引入新的色值，**主色只有 #169BD5 一个**。

### 4. 字段必须对齐 PRD

每个列表的列，都能在 Map1.pdf 或 erpPRD 里找到出处。
新增字段前先确认文档里有，否则评审会被问「这个字段哪来的」。

### 5. 金额与时间

统一用 `utils/format.js`：

```js
money(1286)   // ￥1,286.00；空值返回 —
timeLeft(deadline)  // { text: '快超 3时20分', type: 'warning' }
```

### 6. 权限点只认 `src/data/perm.js`

每个受控按钮挂 `v-can="'b-xxx'"`，权限树里必须有同名 id；只读项（详情 / 盘点单 /
调整单）标 `read: true`，随「查看页面」自动授予。查询、重置、刷新、取消、返回
不单独占权限点。清单与维护检查单见 `docs/页面与按钮清单.md`。

## 七、分工

| 组 | 目录 |
|---|---|
| A | `views/order`、`views/aftersale` |
| B | `views/purchase`、`views/inventory` |
| C | `views/finance`、`views/system`、`views/dashboard` |

公共文件（`router/`、`layouts/`、`components/`、`styles/`）由组长统一维护。

## 八、Git

```
main        可运行版本
dev         日常集成
feat/xxx    个人分支
```

提交信息：`feat(order): 新增批量审核` / `fix(inventory): 修正预警值显示`
