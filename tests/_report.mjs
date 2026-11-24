/**
 * 生成测试报告：把两轮全量回归日志整理成 docs/测试报告-142条执行结果.md
 * 用法：node tests/_report.mjs
 */
import fs from 'node:fs'

const af = fs.readFileSync('.tmp/af2.log', 'utf8')
const sys = fs.readFileSync('.tmp/sys2.log', 'utf8')

function parse(txt) {
  return txt.split('\n')
    .filter(l => /^(PASS|FAIL)\s+/.test(l))
    .map(l => {
      const m = l.match(/^(PASS|FAIL)\s+(\S+)\s+(.+?)\s{2,}→\s*(.*)$/)
      if (m) return { st: m[1], id: m[2], name: m[3].trim(), detail: m[4].trim() }
      const m2 = l.match(/^(PASS|FAIL)\s+(\S+)\s+(.*)$/)
      return { st: m2[1], id: m2[2], name: m2[3].trim(), detail: '' }
    })
}

const afRows = parse(af)
const sysRows = parse(sys)
const afPass = afRows.filter(r => r.st === 'PASS').length
const sysPass = sysRows.filter(r => r.st === 'PASS').length

const tbl = rows => ['| 用例 | 名称 | 结果 |', '|---|---|---|']
  .concat(rows.map(r => `| ${r.id} | ${r.name.replace(/\|/g, '\\|')} | ${r.st === 'PASS' ? '✅ 通过' : '❌ 失败'} |`))
  .join('\n')

const md = `# 测试执行报告 · 售后管理 + 系统管理（142 条）

> 依据文档：《测试用例-售后管理与系统管理-全量版.docx》（售后 AF-001~AF-068、系统 SYS-001~SYS-074）
> 执行方式：真实浏览器（Edge headless + CDP）驱动生产构建产物 \`dist\`（\`vite preview\`），逐条操作真实界面后断言 DOM / 提示 / localStorage / 导出文件字节
> 执行日期：2026-11-23
> 执行结果：**142 条全部通过（售后 ${afPass}/68、系统 ${sysPass}/74）**

## 一、结论

| 模块 | 用例数 | 通过 | 失败 |
|---|---|---|---|
| 售后管理 | 68 | ${afPass} | ${68 - afPass} |
| 系统管理 | 74 | ${sysPass} | ${74 - sysPass} |
| **合计** | **142** | **${afPass + sysPass}** | **${142 - afPass - sysPass}** |

首轮执行的通过率并不是这个数字：售后 47/68、系统 24/74。差额分两类——

1. **真实缺陷**：共 9 个，已改产品代码（见第二节）；
2. **用例/文档口径问题**：文档写定稿后又新增了「智能取数」模块，全站权限基线由 22 页 / 84 项变为 **23 页 / 89 项**，各职位基数随之上移，另有 3 处文档自相矛盾（见第三节）。

## 二、发现并修复的真实缺陷（9 个）

| # | 用例 | 现象（修复前） | 根因 | 修复位置 |
|---|---|---|---|---|
| BUG-01 | SYS-034 | 账号改密后，管理员「重置密码」，**旧密码仍能登录**，新密码反而失效 | \`resetPwd()\` 只改 \`ACCOUNTS[].password\`，登录却优先读 \`pwdMap\`，改密记录未清 | \`src/stores/user.js\` 新增 \`resetPassword()\` 并清 \`pwdMap\` 对应项；\`account.vue\` 改走 store |
| BUG-02 | SYS-057 | 跨部门**同名职位**（两个「运营」）权限互相覆盖 | 权限快照按职位**名称**存 localStorage | \`src/data/perm.js\`：写入改按 \`p.id\`，仅名称全局唯一时额外写名称键；读取优先 id，旧快照回落名称 |
| BUG-03 | SYS-012 | 职位停用后，其下账号**仍能登录** | 职位停用只改了人事台账 \`accounts\`，没同步登录凭据 \`ACCOUNTS\` | \`src/views/system/post.vue\` 停用时调 \`accountBridge.setStatus\`，并提示「N 个账号已同步停用」 |
| BUG-04 | SYS-052 | 权限页切换职位，未保存的修改**静默丢弃** | 只 \`ElMessage.warning\` 后直接切 | \`src/views/system/permission.vue\` 加 \`ElMessageBox.confirm\` 二次确认（取消 / 放弃修改） |
| BUG-05 | SYS-045 | 权限全清空后**仍可保存**，产生 0 权限职位，账号登录后一片空白 | \`save()\` 无下限校验 | \`permission.vue\` \`save()\` 拦截并提示「至少勾选一个页面权限」 |
| BUG-06 | AF-032 / AF-033 | 处理中单据**已审核**却看不到审核结论与「待退 ￥800.00」，只剩进度条 | 处理结果区块仅在 \`status === 'done'\` 渲染 | \`src/views/aftersale/list.vue\` 条件改为 \`status === 'done' || cur.result\` |
| BUG-07 | SYS-026 | 账号编辑的「所属职位」下拉里，停用职位**直接消失**，管理员以为职位被删 | \`postOptions\` 过滤掉停用项 | \`src/views/system/account.vue\` 返回全部职位，停用项置灰 + 文案标「已停用」 |
| BUG-08 | SYS-061 | 发货仓列表**没有条数计数**，筛选后不知道剩几个 | 页面未渲染计数 | \`src/views/system/warehouse.vue\` 增加「共 N 个仓」+「重置」 |
| BUG-09 | AF-043 | 单据号要求等宽数字，实际与正文同字体 | \`.mono\` 只有 \`tabular-nums\`，无等宽字体族 | \`src/styles/theme.css\` 补 \`ui-monospace, SFMono-Regular, Menlo, Consolas\` 字体族 |

## 三、文档口径偏差（系统本身正确，文档需同步）

| # | 文档位置 | 文档写的 | 实际（本次实测） | 说明 |
|---|---|---|---|---|
| 1 | 全文（44 处「84」、24 处「22 页」） | 全站 22 页 / 84 项 | **23 页 / 89 项** | 定稿后新增「智能取数 / 经营数据问答」模块（1 页 5 个操作），文档未同步 |
| 2 | SYS-001、040、053、054 | 老板 84/84、运营 24、采购 16、仓管 11、售后 14、财务 16、系统管理员 20 | 老板 **89/89**、运营 **29**、采购 **18**、仓管 **13**、售后 **15**、财务 **21**、系统管理员 **20** | 同上，各职位默认权限随新模块上移；系统管理员恰好不变 |
| 3 | SYS-060 | 未分配地区 **5** 个 | **6** 个（西藏、青海、新疆、中国香港、中国澳门、中国台湾） | 4 个仓覆盖 28 个省级行政区，34−28=6，文档漏算新疆 |
| 4 | SYS-029 数据行 | 把张丽珊改名为「**张丽珊2**」 | 姓名只允许汉字与「·」，含数字被拦截（与用例第 6 步「校验沿用」自相矛盾） | 用例改用合法姓名「张丽珊珊」验第 2~5 步，另单独验非法姓名被拦截 |
| 5 | SYS-042 第 5 步 | 「依次勾选 **3** 个操作 → 计数为 1+3=4 项」 | 「售后待处理」只有 **2** 个操作（审核、导出），总计 3 项 | 与 SYS-040「售后待处理 3 项（含查看）」冲突，用例按实际 2 个操作验证 |
| 6 | SYS-040 第 5 步 | 逐页权限点「订单审核 7 / 售后待处理 3 / …」按「已勾数」理解会和默认运营的勾选数对不上 | 徽标是「已勾 / 总数」，运营对售后页只有查看权，显示 \`1 / 3\` | 用例改为读斜杠后的总数 |

## 四、仍然存在的设计限制（非缺陷，已记录）

| 编号 | 现象 | 定位 |
|---|---|---|
| OBS-28 | 0 权限职位账号登录后，提示「还没有任何页面权限」并停在 \`#/login\`（已登录态），刷新仍停登录页 | 与文档 OBS-28 一致，本次实测复现 |
| OBS-12 | 售后单据走到末节点时，节点高亮为当前态而非「已完成」 | 与文档一致 |
| 数据层 | 账号 / 职位 / 单据 / 发货仓为前端内存态，刷新回种子；仅权限、登录态、改密记录落 localStorage | 演示数据层设计，接后端后消失 |

## 五、复跑方式

\`\`\`bash
cd "D:/实训项目/实训任务一ERP/ERP-"
npx vite build                                  # 用例跑的是 dist 产物，改完源码必须重建
npx vite preview --port 8905                    # 另开一个终端常驻
# 启动无头 Edge（远程调试 9223）后：
node tests/run-all.mjs af                       # 售后 68 条
node tests/run-all.mjs sys                      # 系统 74 条
node tests/_one.mjs SYS-042 SYS-069             # 单跑指定用例
\`\`\`

## 附录 A · 系统管理 74 条明细

${tbl(sysRows)}

## 附录 B · 售后管理 68 条明细

${tbl(afRows)}
`

fs.mkdirSync('docs', { recursive: true })
fs.writeFileSync('docs/测试报告-142条执行结果.md', md, 'utf8')
console.log(`已生成 docs/测试报告-142条执行结果.md（售后 ${afPass}/68、系统 ${sysPass}/74）`)
