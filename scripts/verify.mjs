import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const base = (process.env.BASE_PATH || "/").replace(/\/$/, "");
const root = resolve("dist");
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const html = walk(root).filter((f) => f.endsWith(".html"));
let checked = 0;
for (const file of html) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let target = match[1].split("#")[0].split("?")[0];
    if (!target.startsWith("/")) continue;
    assert.ok(
      !base || target === base || target.startsWith(base + "/"),
      `base path missing: ${target}`,
    );
    target = decodeURIComponent(target.slice(base.length));
    const local = join(root, target);
    assert.ok(
      existsSync(local) || existsSync(join(local, "index.html")),
      `${file}: broken ${target}`,
    );
    checked++;
  }
}
const demo = readFileSync(join(root, "demo/reading/index.html"), "utf8");
assert.ok(demo.includes("noindex,nofollow"));
assert.ok(
  demo.includes("katex-display") && demo.includes("astro-code"),
  "formula and code must render",
);
assert.ok(
  !existsSync(join(root, "blog/reading-demo/index.html")),
  "demo must not publish as a post",
);
assert.ok(existsSync(join(root, "pagefind/pagefind.js")));
if (process.env.SITE_URL) {
  const rss = readFileSync(join(root, "rss.xml"), "utf8");
  assert.ok(
    !rss.includes("reading-demo") && !rss.includes("/demo/"),
    "demo must not enter RSS",
  );
  const maps = walk(root).filter((f) => /sitemap.*\.xml$/.test(f));
  assert.ok(maps.length);
  for (const f of maps) assert.ok(!readFileSync(f, "utf8").includes("/demo/"));
}
console.log(
  `PASS: ${html.length} pages, ${checked} local links/assets; math, highlighted code, demo isolation and Pagefind checked.`,
);
