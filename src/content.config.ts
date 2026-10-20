import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(["算法与建模", "竞赛复盘", "软件工程", "学习与研究"]),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(true),
      demo: z.boolean().default(false),
    })
    .refine((p) => p.demo || p.draft || !!p.pubDate, {
      message: "正式文章必须填写 pubDate",
    }),
});
const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.enum(["project", "community"]),
    role: z.string().optional(),
    status: z.string(),
    featured: z.boolean(),
    order: z.number(),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});
export const collections = { posts, projects };
