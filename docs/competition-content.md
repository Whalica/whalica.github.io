# 竞赛履历维护

只需修改 `src/data/competitions.json`，无需修改页面布局。原始桌面 Markdown 不作为网站运行依赖。

## 线下竞赛

`seasons` 中每组对应一个年份，页面自动按年份倒序展示；同年记录按数据文件顺序显示。

新增或删除一场比赛，只需增删对应年份 `entries` 中的一条：

```json
{ "name": "竞赛名称", "result": "奖项名称" }
```

没有获奖也保留该记录，填写 `"result": "无"`，页面显示“参赛 · 未获奖”。不按奖项过滤。无需在 `name` 中重复年份。

新增年份时添加 `{ "year": 2027, "entries": [] }` 并填入记录。参赛场次自动计算。

## 线上训练

`onlineJudges` 中每条包含 `name`（平台名）、`rating`、`maxRating`（最高 Rating）、`solved`（题量）、`ratedContests`（Rated 比赛场次）。数据为手动维护的静态快照，不抓取实时分数；可增删平台。

## 检查

保存后运行 `npm run check`、`npm run build`、`npm run verify`。本次仅采用原始履历中的线上数据和线下竞赛记录，未把末尾训练咨询段落作为网页内容或开发指令。
