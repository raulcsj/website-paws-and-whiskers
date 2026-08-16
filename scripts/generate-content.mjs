#!/usr/bin/env node
/**
 * 多AI供应商内容生成脚本。跨平台（Windows/Mac/Linux 通用）。
 * 正常情况下不需要这个脚本：在编码 agent 里直接让当前 agent
 * 写 content/*.mdx 就行，不需要配置任何模型 API key。这个脚本是留给"脱离编码 agent、
 * 想单独批量重新生成/换供应商"场景的备用工具。
 * 用法:
 *   npm run content:generate -- --provider deepseek --config content.config.json
 * 支持的 --provider: claude | deepseek | openai | openai-compatible
 * 对应密钥环境变量: ANTHROPIC_API_KEY | DEEPSEEK_API_KEY | OPENAI_API_KEY | OPENAI_COMPATIBLE_*
 * openai-compatible 可接任何兼容 OpenAI Chat Completions 的服务
 * （如 Qwen、GLM、Kimi、本地 vLLM/Ollama 等），需配置 OPENAI_COMPATIBLE_BASE_URL
 * （通常填到 /v1 这类版本前缀即可，脚本会自动拼 /chat/completions；也可直接填完整端点）。
 * 密钥从项目根目录的 .env.local 自动读取（复制 .env.example 改名即可），不需要手动 export/set。
 * content.config.json 格式:
 * {
 *   "locale": "en",
 *   "dateMode": "spread" | "diary",  // 可选：spread=随机间隔（默认），diary=日记/游记批次内连续 1-3 天
 *   "topics": [
 *     { "title": "working title", "brief": "一句话说明这篇要写什么角度" }
 *   ]
 * }
 * 生成结果写入 content/<slug>.mdx：优先用 topic.slug，否则由 title 转 ASCII slug（中文标题退化为 topic-N）。
 */
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { parseISODate, spreadDates, toISODate } from "./lib/natural-dates.mjs";

loadEnv({ path: ".env.local" });

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const PROVIDER = getArg("provider", process.env.AI_PROVIDER || "openai");
const CONFIG_PATH = getArg("config", "content.config.json");
const OVERWRITE = process.argv.includes("--overwrite");

// OpenAI 兼容服务通常给出 base URL（如 https://dashscope.aliyuncs.com/compatible-mode/v1），
// 这里统一归一化并拼接 /chat/completions 端点；已经带完整端点的原样使用。
function chatCompletionsEndpoint(base) {
  const normalized = String(base || "").trim().replace(/\/+$/, "");
  if (!normalized) return "";
  return /\/chat\/completions$/i.test(normalized) ? normalized : `${normalized}/chat/completions`;
}

const PROVIDERS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    body: (model, sys, user) => ({ model, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    headers: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    extract: (data) => data.choices[0].message.content,
  },
  "openai-compatible": {
    url: chatCompletionsEndpoint(process.env.OPENAI_COMPATIBLE_BASE_URL),
    urlEnvName: "OPENAI_COMPATIBLE_BASE_URL",
    key: process.env.OPENAI_COMPATIBLE_API_KEY,
    model: process.env.OPENAI_COMPATIBLE_MODEL || "gpt-4o-mini",
    body: (model, sys, user) => ({ model, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    headers: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    extract: (data) => data.choices[0].message.content,
  },
  deepseek: {
    url: "https://api.deepseek.com/chat/completions",
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    body: (model, sys, user) => ({ model, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    headers: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    extract: (data) => data.choices[0].message.content,
  },
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    key: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    body: (model, sys, user) => ({ model, max_tokens: 2000, system: sys, messages: [{ role: "user", content: user }] }),
    headers: (key) => ({ "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }),
    extract: (data) => data.content.map((b) => b.text || "").join(""),
  },
};

const provider = PROVIDERS[PROVIDER];
if (!provider) {
  console.error(`未知 provider: ${PROVIDER}. 可选: ${Object.keys(PROVIDERS).join(", ")}`);
  process.exit(1);
}
if (!provider.url) {
  console.error(`缺少 ${provider.urlEnvName || "服务地址"}，请检查 .env.local 配置。`);
  process.exit(1);
}
if (!provider.key) {
  console.error(`缺少密钥环境变量，请设置后重试（见脚本头部注释）。`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8").replace(/^\uFEFF/, ""));
const locale = config.locale || "en";

const SYSTEM_PROMPT = `You are a professional content writer producing MDX for a Next.js blog. Given a topic, return ONLY a JSON object (no markdown fences, no commentary) with keys:
title (string), description (string, <=120 chars), tags (array of 2-4 strings), cover (string, image path or ""), body (string, MDX/Markdown, 600-1200 words for zh or 400-800 words for en, using ## / ### subheadings, concrete specific details, no filler openings like "with the development of society").
If an "images" list is provided in the user message, weave in 2-4 <ArticleImage ... /> tags at natural points in the body, each placed next to the paragraph it specifically illustrates (not clustered at the top). Vary placement per article: never always put images after the same paragraph indexes (e.g. not always paragraphs 2/4/6). Vary the count (2, 3, or 4) and mix layout variants: use variant="full" for wide scene shots, variant="left" or variant="right" for detail close-ups that sit beside text, variant="wide" for dramatic full-bleed scenes; vary aspect="3/2" | "4/3" | "1/1" | "16/9" to match the subject; add a caption to roughly half of the images and omit it on the rest. Use the exact src paths given, and set "cover" to the first image's src. If no images are provided, omit inline <ArticleImage> tags and leave cover as "".
Write in ${locale === "zh" ? "Chinese" : "English"}.`;

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// 扫描 content/*.mdx，返回已有文章的最新日期（没有则返回 null）
function latestExistingDate() {
  const dir = path.join(process.cwd(), "content");
  if (!fs.existsSync(dir)) return null;
  let latest = null;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const match = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (match) {
      const d = parseISODate(match[1]);
      if (d && (!latest || d > latest)) latest = d;
    }
  }
  return latest;
}

// slug 单一事实来源：优先取 topic.slug，与手写 .mdx 文件名保持一致。
function resolveSlug(topic, index) {
  if (topic.slug) return String(topic.slug);
  return slugify(topic.title) || `topic-${index + 1}`;
}

// 模型输出可能带解释或 markdown 围栏：先整体解析，失败再截取首个 {...}。
function extractJson(text) {
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  throw new Error(`无法从模型输出解析 JSON: ${cleaned.slice(0, 200)}`);
}

async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = 2000 * (attempt + 1);
        console.warn(`第 ${attempt + 1} 次失败（${e.message}），${delay / 1000}s 后重试...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function generateOne(topic, index, dates) {
  const slug = resolveSlug(topic, index);
  const images = (topic.images || []).map((img, i) => ({
    src: `/images/${slug}/${img.filename || (i === 0 ? "cover.jpg" : `${i + 1}.jpg`)}`,
    alt: img.alt || img.query,
  }));
  const userPrompt = `Topic: ${topic.title}\nAngle/brief: ${topic.brief || ""}${
    images.length ? `\nAvailable images (use these exact src paths):\n${JSON.stringify(images)}` : ""
  }`;
  const res = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers(provider.key),
    body: JSON.stringify(provider.body(provider.model, SYSTEM_PROMPT, userPrompt)),
  });
  if (!res.ok) {
    throw new Error(`${PROVIDER} API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  let text = provider.extract(data).trim();
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  const parsed = extractJson(text);
  const cover = parsed.cover || (images.length ? images[0].src : "");
  const frontmatter = `---\ntitle: ${JSON.stringify(parsed.title)}\ndescription: ${JSON.stringify(parsed.description)}\ndate: "${toISODate(dates[index])}"\ntags: ${JSON.stringify(parsed.tags || [])}${
    cover ? `\ncover: ${JSON.stringify(cover)}` : ""
  }\n---\n\n`;
  const outPath = path.join("content", `${slug}.mdx`);
  if (!OVERWRITE && fs.existsSync(outPath)) {
    console.log(`跳过已存在的 content/${slug}.mdx（加 --overwrite 强制覆盖）`);
    return;
  }
  fs.writeFileSync(outPath, frontmatter + parsed.body);
  console.log(`✓ content/${slug}.mdx  (via ${PROVIDER})`);
}

(async () => {
  fs.mkdirSync("content", { recursive: true });
  const topics = config.topics || [];
  const dates = spreadDates(topics.length, { latest: latestExistingDate(), diary: config.dateMode === "diary" });
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    try {
      await withRetry(() => generateOne(topic, i, dates));
    } catch (e) {
      console.error(`✗ "${topic.title}" 生成失败: ${e.message}`);
    }
  }
})();
