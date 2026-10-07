# 结对编程作业：校园失物招领 Web 实现

> 提交前请补充：结对同学博客链接、本作业博客链接、两位同学姓名、GitHub commit / PR 截图。主仓库已创建，地址见下文。

## 一、作业信息与分工

- 结对成员 A：【姓名 / 学号 / 博客链接，提交前填写】
- 结对成员 B：【姓名 / 学号 / 博客链接，提交前填写】
- 本作业博客：【发布后填写】
- GitHub 项目：https://github.com/endlessmaybe/292400336-182400143

分工建议：A 负责需求梳理、页面结构与搜索筛选；B 负责发布、详情、状态维护与测试；两人共同进行代码复审、Chrome 走查和博客整理。最终按你们真实分工修改，不能照抄建议。

## 二、PSP

PSP 完整表格见 `docs/PSP.md`。本次实际耗时高于预估的部分主要集中在具体设计和测试阶段，原因是后续补充了状态维护入口、异常路径和更多单元测试。这比把预估耗时和实际耗时机械写成完全一致更能反映真实开发过程。

## 三、需求分析与设计实现

第一次原型已经确定了校园失物招领的核心问题：信息散落在不同群聊中，消息很快被覆盖，后续搜索困难；即使失主和拾取者已经完成交接，旧消息仍持续传播，容易产生重复询问。

第二次作业我们主动收缩范围，只实现题目真正要求的主流程：

```text
发布信息
   ↓
浏览 / 搜索 / 筛选
   ↓
查看详情
   ↓
复制联系方式并联系发布者
   ↓
发布者在“我的发布”更新状态
   ↓
寻物：已找到 / 招领：已归还
```

我们没有加入复杂后台、实名认证、站内聊天和地图定位。原因不是这些功能没有价值，而是本次作业重点是把信息发布和状态维护这条主流程真正做完整。

### 页面结构

1. 信息广场：首页展示最新寻物/招领信息、关键词搜索、信息类型筛选、类别筛选、地点筛选和状态筛选。
2. 发布页面：填写类型、物品名称、类别、地点、日期、物品描述、联系人和联系方式。
3. 详情页面：展示完整信息和联系方式，并提供一键复制。
4. 我的发布：发布者可以集中查看自己发布的内容，并把信息更新为“已找到”或“已归还”。

### 数据流

```text
发布表单 ──校验──> createItem ──> localStorage
                                  │
                                  ├──> 首页 filterItems ──> 信息卡片
                                  ├──> 详情页 ──> 联系方式
                                  └──> 我的发布 ──updateStatus──> localStorage
```

项目采用浏览器 `localStorage` 做本地持久化，避免引入后端。这样助教下载整个目录后，直接用 Chrome 打开 `index.html` 就可以看到完整交互，同时刷新页面后自己发布的数据仍然存在。

## 四、代码实现思路

项目把数据逻辑和界面交互分开：`js/store.js` 负责数据校验、搜索筛选、状态更新和持久化；`js/app.js` 负责页面渲染、路由、表单和按钮交互。这样核心逻辑可以脱离 DOM 单独进行单元测试。

### 关键代码 1：组合搜索和筛选

```js
function filterItems(items, filters = {}) {
  const keyword = normalize(filters.keyword);
  return items
    .filter((item) => filters.type === 'all' || !filters.type || item.type === filters.type)
    .filter((item) => filters.category === 'all' || !filters.category || item.category === filters.category)
    .filter((item) => filters.location === 'all' || !filters.location || item.location === filters.location)
    .filter((item) => filters.status === 'all' || !filters.status || item.status === filters.status)
    .filter((item) => !keyword || [item.title, item.description, item.location, item.category]
      .some((field) => normalize(field).includes(keyword)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
```

它解决了“只记得大概物品或地点”的情况，关键词会同时匹配名称、描述、地点和类别。

### 关键代码 2：发布者更新状态

```js
function updateStatus(items, id, actorId = OWNER_ID) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('信息不存在。');
  if (items[index].ownerId !== actorId) throw new Error('只有发布者可以更新这条信息。');

  const next = clone(items);
  next[index].status = 'resolved';
  next[index].resolvedAt = nowIso();
  return next;
}
```

这段代码保证“谁来修改、从哪里修改、修改后别人看到什么”是完整的：本人从“我的发布”或自己信息的详情页修改，写回本地存储后，首页和详情都会读取最新状态。

## 五、附加特点设计与展示

### 特点 1：类别、地点、状态组合筛选

意义：校园里很多人只能回忆起“大概在图书馆”“好像是电子产品”，单纯靠精确名称搜索不够。因此在关键词之外增加组合筛选，让用户更快缩小范围。

实现：所有筛选条件统一传给 `filterItems`，条件之间采用 AND 关系；关键词内部则匹配多个字段。

### 特点 2：一键复制联系方式

意义：不增加站内聊天，也能减少手动输入 QQ / 微信 / 手机号造成的错误，保持功能轻量。

实现：优先调用 Clipboard API，浏览器不允许时回退到兼容复制方式。

## 六、目录说明与使用说明

仓库中的网页项目位于 `校园失物招领-结对编程作业/`。目录按页面结构、样式、交互逻辑、测试和说明材料分开：

```text
292400336-182400143/
├─ README.md                         # 仓库首页的目录与使用说明
└─ 校园失物招领-结对编程作业/
   ├─ index.html                     # 网页入口与各页面模板
   ├─ favicon.svg                    # 浏览器标签页图标
   ├─ css/
   │  └─ styles.css                 # 页面样式与移动端适配
   ├─ js/
   │  ├─ store.js                   # 数据、搜索筛选、状态更新与本地存储
   │  └─ app.js                     # 页面渲染、路由与按钮交互
   ├─ screenshots/                  # 页面截图与核心流程图
   │  ├─ 01-home.png
   │  ├─ 02-publish.png
   │  ├─ 03-mine.png
   │  └─ 04-core-flow.svg
   ├─ docs/
   │  ├─ PSP.md                     # PSP 耗时记录
   │  ├─ TEST_REPORT.md             # 测试报告
   │  ├─ BLOG_DRAFT.md              # 博客草稿
   │  └─ SUBMISSION_CHECKLIST.md    # 提交清单
   ├─ tests/
   │  └─ store.test.js              # 本地单元测试
   ├─ run-tests.bat                  # Windows 测试脚本
   └─ 双击打开网页.bat               # Windows 启动脚本
```

`favicon.svg` 与 `screenshots/` 中的素材随项目提供。网页使用原生 HTML、CSS 和 JavaScript，没有第三方前端框架、后端服务或在线 CDN。

测试人员使用步骤：

1. 从 [GitHub 主仓库](https://github.com/endlessmaybe/292400336-182400143) 下载 ZIP 并完整解压，进入 `校园失物招领-结对编程作业` 文件夹。
2. 用 Google Chrome 打开 `index.html`；Windows 也可双击 `双击打开网页.bat`。网页无需安装依赖或启动服务器。
3. 首页默认显示 6 条演示信息。可搜索“校园卡”、选择寻物/招领及类别、地点、状态筛选，再点“查看详情”查看联系方式。
4. 点击“发布信息”填写新信息；发布后到“我的发布”查看，并在找回或归还后更新状态。发布内容保存在当前浏览器的 `localStorage` 中。
5. 如需复核自动化测试，在项目目录运行 `node --test tests\store.test.js`（需要 Node.js 18+）；测试代码不属于网页运行依赖。

仓库根目录的 `README.md` 另有完整文件用途和验收顺序，可供测试时对照。

## 七、单元测试

我们使用 Node.js 自带 `node:test`，当前设计 14 个测试用例，数量超过题目“至少 10 个”的要求。测试覆盖发布校验、名称/描述/地点搜索、类型筛选、组合筛选、状态筛选、本人更新状态、非本人拒绝更新以及排序。

单元测试简易教程、白盒用例设计和测试数据思路见 `docs/TEST_REPORT.md`。

最终执行结果为 **14/14 全部通过**，`js/store.js` 与 `js/app.js` 也通过 JavaScript 语法检查。

### Chrome 实际走查

除了函数测试，我们还用本机 Google Chrome 对页面做了完整走查。首次进入时能看到 6 条演示数据；搜索不存在的关键词会出现空结果提示；随后实际完成了“发布银色U盘 → 查看详情 → 复制联系方式 → 我的发布 → 标记已找到 → 回到首页搜索验证”的完整流程。状态更新后，首页能立即看到“已找到”。最终 Chrome 控制台检查为 0 error / 0 warning。

【这里放终端测试通过截图，以及发布、详情、状态更新截图】

## 八、GitHub 代码签入记录

第一位同学【姓名，学号 292400336】创建 `292400336-182400143` 仓库并上传网页项目；第二位同学【姓名，学号 182400143】fork 原仓库，在自己的分支中完成实际修改。有可检查的进展时，第二位同学向原仓库发起 Pull Request，由第一位同学审查并合并。

原仓库：https://github.com/endlessmaybe/292400336-182400143

Fork 仓库：https://github.com/Ther-ux/292400336-182400143

Pull Request：https://github.com/endlessmaybe/292400336-182400143/pull/1

该 Pull Request 已合并到主仓库。

单元测试可只在本地运行，不必上传 GitHub；上文保留测试设计与实际结果。这里展示双方真实的 commit 记录和 Pull Request 截图，不预写尚未发生的提交。

## 九、遇到的问题与解决方法

### 问题 1：功能列表有“状态更新”，但流程容易断在“联系发布者”

最初如果只设计首页、发布和详情，用户联系成功后没有明确的结束入口。我们把“我的发布”作为发布者维护入口，同时允许本人在详情页直接更新状态。更新后首页卡片和详情都会显示“已找到 / 已归还”，流程真正结束。

### 问题 2：只有成功路线时，很难发现输入和搜索问题

我们在测试时专门加入空必填项、描述过短、搜索无结果、多条件组合后无结果、搜索词带空格、英文大小写变化等情况。这样页面不只是在演示数据下“看起来能用”。

## 十、结对收获与队友评价

【两位同学提交前分别用自己的真实经历填写。不要虚构。】

可以从这些角度写：对方值得学习的地方、沟通方式、负责模块的完成质量、代码复审中提出的有效意见，以及下一次可以改进的地方。

## 十一、成果展示

建议博客依次放以下真实截图：

1. 首页与信息卡片。
2. 搜索 + 组合筛选结果。
3. 发布表单。
4. 信息详情与复制联系方式。
5. “我的发布”与状态更新前后。
6. 单元测试全部通过。

项目 `screenshots/` 目录会保存本机 Chrome 实际运行截图，可直接用于整理博客。

其中 `screenshots/04-core-flow.svg` 是本次作业核心流程图，可在博客中作为“关键实现流程图”使用。
