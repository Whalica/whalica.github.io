export const href = (path = "") =>
  import.meta.env.BASE_URL.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
export const categories = ["算法与建模", "竞赛复盘", "软件工程", "学习与研究"];
export const date = (value: Date) =>
  value.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
