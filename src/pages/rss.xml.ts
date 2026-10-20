import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { href } from "../lib/site";
export async function GET(context: APIContext) {
  if (!context.site)
    return new Response("RSS requires SITE_URL configuration.", {
      status: 404,
    });
  const posts = await getCollection(
    "posts",
    (p) => !p.data.draft && !p.data.demo,
  );
  return rss({
    title: "Whalica · 技术手记",
    description: "记录算法思考、工程实践与持续探索",
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate!,
      link: href("blog/" + p.id + "/"),
    })),
  });
}
