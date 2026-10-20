# 爱好与成就维护

编辑 `src/data/interests.json` 即可更新“关于”页，无需改页面布局。

## 音游

`rhythmGames` 每条对应一张游戏卡片，可增删整条对象：

- `name`：游戏名称。
- `metric`：指标名称。Arcaea 为 PTT，Phigros 为 RKS，Malody 可改为需要展示的指标。
- `value`：分数或等级。未填写时保留 `null`，页面显示“待填写”，不会用 0 代替；需要保留小数位时使用字符串，如 `"12.00"`。
- `achievements`：成就文字数组，每条文字对应一行。空数组时显示“成就记录待补充”。

## 更多兴趣

`otherInterests` 每条包含 `name` 和 `works`（作品或记录文字数组）。已预留游戏、绘画、媒体创作；空数组表示暂未填写。

保存后运行 `npm run check`、`npm run build`、`npm run verify`。
