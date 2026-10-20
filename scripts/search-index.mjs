import { createIndex, close } from "pagefind";
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
const root = resolve("dist");
const output = join(root, "pagefind");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const { index, errors } = await createIndex({
  forceLanguage: "zh",
  rootSelector: "[data-pagefind-body]",
});
if (errors.length || !index) throw new Error(errors.join("\n"));
try {
  let count = 0;
  for (const path of walk(join(root, "blog")).filter((p) =>
    p.endsWith(".html"),
  )) {
    const content = readFileSync(path, "utf8");
    if (!content.includes("data-pagefind-body")) continue;
    const base = (process.env.BASE_PATH || "/").replace(/\/$/, "");
    const result = await index.addHTMLFile({
      url:
        base +
        "/" +
        relative(root, path)
          .replaceAll("\\", "/")
          .replace(/index\.html$/, ""),
      content,
    });
    if (result.errors.length) throw new Error(result.errors.join("\n"));
    count++;
  }
  const result = await index.getFiles();
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  rmSync(output, { recursive: true, force: true });
  for (const file of result.files) {
    const path = resolve(output, file.path);
    if (!path.startsWith(output + "/") && !path.startsWith(output + "\\"))
      throw new Error("Invalid index file");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
  }
  console.log(
    `Pagefind: ${count} published articles, ${result.files.length} files written.`,
  );
} finally {
  await close();
}
