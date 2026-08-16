#!/usr/bin/env node
/**
 * 部署前检查（npm run check）：
 * - content/*.mdx 的必需 frontmatter（title / description / date / cover）是否齐全
 * - 正文是否按 H2 小节分布视觉块（每小节至少一个图文/结构块，否则阻断）
 * - 封面图和正文 <ArticleImage> 引用的图片文件是否真实存在于 public/
 * - 文章 slug 是否与 content.config.json 里对应 topic 的 slug 一致（提醒，不阻断）
 *
 * 会被 npm run preview 和两个 deploy 脚本自动调用，图片缺失时拒绝部署。
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const CONFIG_PATH = path.join(process.cwd(), "content.config.json");

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function countVisualBlocks(text) {
  return (
    String(text).match(/<(ArticleImage|ImageText|Gallery|Callout|PullQuote|Steps|FactCard)\b/g) || []
  ).length;
}

const problems = [];
const fail = (msg) => {
  problems.push(msg);
  console.error(`✗ ${msg}`);
};
const warn = (msg) => console.log(`⚠ ${msg}`);

if (!fs.existsSync(CONTENT_DIR)) {
  console.log("没有 content/ 目录，跳过内容检查。");
  process.exit(0);
}

const config = fs.existsSync(CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8").replace(/^\uFEFF/, ""))
  : { topics: [] };
const topics = config.topics || [];
const dates = [];

for (const file of fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"))) {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const { data, content } = matter(raw);

  for (const field of ["title", "description", "date", "cover"]) {
    if (!data[field]) fail(`content/${file}: frontmatter 缺少 ${field}`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(data.date || ""))) {
    dates.push(String(data.date));
  }

  const h2Sections = content.split(/^##[ \t]+/gm);
  h2Sections.shift();
  const sections = h2Sections;
  const totalVisual = countVisualBlocks(content);

  if (sections.length > 0) {
    sections.forEach((section, i) => {
      if (countVisualBlocks(section) === 0) {
        fail(
          `content/${file}: 第 ${i + 1} 个 H2 小节缺少视觉块（至少使用一个 ArticleImage/ImageText/Gallery/Callout/PullQuote/Steps/FactCard）`
        );
      }
    });
  } else if (totalVisual < 2) {
    fail(`content/${file}: 正文视觉块不足（当前 ${totalVisual} 个，至少 2 个）`);
  }

  const textSegmentLengths = content
    .split(/<(ArticleImage|ImageText|Gallery|Callout|PullQuote|Steps|FactCard)\b/)
    .map((segment) => segment.replace(/\s+/g, "").length);
  if (textSegmentLengths.some((len) => len > 500)) {
    warn(`content/${file}: 存在较长的连续纯文字，建议每 2-3 段插入一个视觉块`);
  }

  if (sections.length >= 2) {
    const sectionsWithVisual = sections.filter((section) => countVisualBlocks(section) > 0).length;
    if (sectionsWithVisual === 1) {
      warn(`content/${file}: 视觉块集中在一个 H2 小节，建议每个主题小节都搭配对应视觉块`);
    }
  }

  const srcs = [];
  if (data.cover) srcs.push(data.cover);
  for (const m of content.matchAll(/src="(\/images\/[^"]+)"/g)) srcs.push(m[1]);

  for (const src of new Set(srcs)) {
    const filePath = path.join(PUBLIC_DIR, src.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      fail(`content/${file}: 引用的图片不存在: ${src}（先运行 npm run images:fetch）`);
    }
  }

  if (topics.length > 0 && !topics.some((t) => (t.slug || slugify(t.title)) === slug)) {
    warn(`content/${file}: slug "${slug}" 不在 content.config.json 的 topics 里，建议在对应 topic 补充 "slug": "${slug}"`);
  }
}

// 日期分布自然度提醒（不阻断，但建议修）：等间距或整批同一天是最容易被识破的机器痕迹
const validDates = [...new Set(dates)].sort();
if (validDates.length >= 3) {
  const gaps = [];
  for (let i = 1; i < validDates.length; i++) {
    const ms = Date.parse(validDates[i]) - Date.parse(validDates[i - 1]);
    if (ms > 0) gaps.push(Math.round(ms / 86400000));
  }
  if (gaps.length >= 2 && new Set(gaps).size === 1) {
    warn(`文章日期过于规律：相邻日期间隔均为 ${gaps[0]} 天，建议按随机节奏分布（见 content-guide.md「日期与更新节奏」）`);
  }
}
if (dates.length >= 3 && validDates.length === 1) {
  warn(`全部 ${dates.length} 篇文章日期相同（${validDates[0]}），建议按真实更新节奏分布（见 content-guide.md「日期与更新节奏」）`);
}

if (problems.length > 0) {
  console.error(`\n检查失败：${problems.length} 个问题。修复后重试（图片缺失可运行 npm run images:fetch）。`);
  process.exit(1);
}

// AdSense 就绪度提醒（不阻断构建，但申请前应处理）
for (const rel of ["app/about/page.tsx", "app/contact/page.tsx", "app/privacy/page.tsx"]) {
  const filePath = path.join(process.cwd(), rel);
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8").includes("TODO")) {
    warn(`${rel} 仍含 TODO 占位内容，申请 AdSense 前请替换为真实信息`);
  }
}
const siteTs = path.join(process.cwd(), "lib", "site.ts");
if (fs.existsSync(siteTs) && fs.readFileSync(siteTs, "utf8").includes("example.vercel.app")) {
  warn("站点域名仍是占位域名 example.vercel.app，申请 AdSense 前请设置真实域名（scaffold 传 site_url 或构建时设置 NEXT_PUBLIC_SITE_URL）");
}

console.log("✓ 检查通过：frontmatter 完整、正文视觉块分布合规、所有引用的图片都存在。");
