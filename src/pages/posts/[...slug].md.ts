import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

// 构建时把每篇文章的 Markdown 原文一起输出，供页面上的“下载 .md”使用
const sources = import.meta.glob<string>("/src/content/posts/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection(
    "posts",
    (post) => !post.data.draft && !post.data.demo,
  );
  return posts.map((post) => ({ params: { slug: post.id } }));
};

export const GET: APIRoute = ({ params }) => {
  const key = `/src/content/posts/${params.slug}.md`;
  const body = sources[key];
  if (!body) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
