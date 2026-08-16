#!/usr/bin/env node
/**
 * 多来源配图脚本：优先用真实照片（更自然生动），找不到合适的再用 AI 生图兜底。跨平台（Windows/Mac/Linux 通用）。
 * 用法:
 *   npm run images:fetch -- --provider pexels --config content.config.json
 * 支持的 --provider:
 *   pexels    实拍图，免费商用，需要 PEXELS_API_KEY        https://www.pexels.com/api/
 *   unsplash  实拍图，免费商用，需要 UNSPLASH_ACCESS_KEY    https://unsplash.com/developers
 *   openai    AI生成图 (gpt-image-1)，需要 OPENAI_API_KEY，适合抽象/插画类主题
 *
 * 密钥从项目根目录的 .env.local 自动读取（复制 .env.example 改名即可），不需要手动 export/set。
 * 缺密钥时会交互式询问并自动保存到 .env.local；自动化场景可用 --<provider>-key <key> 传参，或 --non-interactive 禁用询问。
 *
 * content.config.json 里每个 topic 可以带 images 数组：
 *   "images": [{ "query": "narrow stone alley in Kyoto at dusk", "alt": "...", "filename": "cover.jpg" }]
 * 没写 filename 的默认命名为 cover.jpg（第一张）、2.jpg、3.jpg ...；下载结果与 content-guide 的约定一致。
 * 下载结果存到 public/images/<slug>/<filename>，slug 与对应 content/<slug>.mdx 保持一致
 * （需要与 generate-content.mjs 用同一份 slugify 规则，脚本内已内置）。
 */
import fs from "fs";
import path from "path";
import readline from "readline";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const PROVIDER = getArg("provider", process.env.IMAGE_PROVIDER || "pexels");
const CONFIG_PATH = getArg("config", "content.config.json");
const OVERWRITE = process.argv.includes("--overwrite");
const NON_INTERACTIVE = process.argv.includes("--non-interactive");

const KEY_CONFIG = {
  pexels: { envVar: "PEXELS_API_KEY", flag: "pexels-key", label: "Pexels API Key", url: "https://www.pexels.com/api/" },
  unsplash: { envVar: "UNSPLASH_ACCESS_KEY", flag: "unsplash-key", label: "Unsplash Access Key", url: "https://unsplash.com/developers" },
  openai: { envVar: "OPENAI_API_KEY", flag: "openai-key", label: "OpenAI API Key", url: "https://platform.openai.com/api-keys" },
};

function promptInput(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// 把密钥写入 .env.local（已被 .gitignore 忽略），保留已有行，重复键原位覆盖。
function saveEnvLocal(entries) {
  const envPath = path.join(process.cwd(), ".env.local");
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(entries)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(envPath, lines.filter((l) => l.trim() !== "").join("\n") + "\n");
}

// 向导式密钥获取：--<provider>-key 参数 > 环境变量 > 交互式输入 > 报错退出。
async function ensureProviderKey(provider) {
  const cfg = KEY_CONFIG[provider];
  if (!cfg) return;
  if (process.env[cfg.envVar] && process.env[cfg.envVar].trim()) return;
  const fromFlag = getArg(cfg.flag, "");
  if (fromFlag) {
    process.env[cfg.envVar] = fromFlag;
    saveEnvLocal({ [cfg.envVar]: fromFlag });
    console.log(`✓ 已保存 ${cfg.envVar} 到 .env.local`);
    return;
  }
  if (NON_INTERACTIVE) {
    throw new Error(`缺少 ${cfg.envVar}（可用 --${cfg.flag} 传入、设置环境变量，或复制 .env.example 为 .env.local 后填写）`);
  }
  const answer = await promptInput(
    `未检测到 ${cfg.envVar}（${cfg.label}，免费申请: ${cfg.url}）。\n请输入密钥后回车: `
  );
  if (!answer) throw new Error(`未输入 ${cfg.envVar}，终止配图。`);
  process.env[cfg.envVar] = answer;
  saveEnvLocal({ [cfg.envVar]: answer });
  console.log(`✓ 已保存 ${cfg.envVar} 到 .env.local（.gitignore 已忽略该文件，不会提交）。`);
}

// slug 只保留 ASCII 小写字母数字（与 references/content-guide.md 的命名规则一致）。
// 中文标题会得到空串，由 resolveSlug 退化为 topic-N；建议在 content.config.json 里手写英文 slug。
function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// slug 单一事实来源：优先取 topic.slug（与手写 .mdx 文件名保持一致）。
function resolveSlug(topic, index) {
  if (topic.slug) return String(topic.slug);
  return slugify(topic.title) || `topic-${index + 1}`;
}

async function downloadBinary(url, destPath, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`下载失败 ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}

async function fetchPexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("缺少 PEXELS_API_KEY");
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
    headers: { Authorization: key },
  });
  if (!res.ok) throw new Error(`Pexels API error ${res.status}`);
  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) throw new Error(`Pexels 没有找到匹配 "${query}" 的图片`);
  return photo.src.large || photo.src.large2x;
}

async function fetchUnsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("缺少 UNSPLASH_ACCESS_KEY");
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) throw new Error(`Unsplash API error ${res.status}`);
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) throw new Error(`Unsplash 没有找到匹配 "${query}" 的图片`);
  return photo.urls.regular;
}

async function generateOpenAI(query) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("缺少 OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt: query, size: "1536x1024" }),
  });
  if (!res.ok) throw new Error(`OpenAI images API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI 未返回图片数据");
  return { base64: b64 };
}

async function fetchOne(provider, query, destPath) {
  if (provider === "pexels") {
    const url = await fetchPexels(query);
    await downloadBinary(url, destPath);
  } else if (provider === "unsplash") {
    const url = await fetchUnsplash(query);
    await downloadBinary(url, destPath);
  } else if (provider === "openai") {
    const { base64 } = await generateOpenAI(query);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(base64, "base64"));
  } else {
    throw new Error(`未知 provider: ${provider}. 可选: pexels, unsplash, openai`);
  }
}

(async () => {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8").replace(/^\uFEFF/, ""));
  const topics = config.topics || [];
  const hasImages = topics.some((t) => t.images && t.images.length > 0);
  if (!hasImages) {
    console.log("content.config.json 里还没有配置 images，无需取图。");
    process.exit(0);
  }
  try {
    await ensureProviderKey(PROVIDER);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
  let okCount = 0;
  let failCount = 0;
  for (let t = 0; t < topics.length; t++) {
    const topic = topics[t];
    if (!topic.images || topic.images.length === 0) continue;
    const slug = resolveSlug(topic, t);
    for (let i = 0; i < topic.images.length; i++) {
      const img = topic.images[i];
      const filename = img.filename || (i === 0 ? "cover.jpg" : `${i + 1}.jpg`);
      const dest = path.join("public", "images", slug, filename);
      if (!OVERWRITE && fs.existsSync(dest)) {
        console.log(`跳过已存在: public/images/${slug}/${filename}（加 --overwrite 强制重新获取）`);
        continue;
      }
      try {
        await fetchOne(PROVIDER, img.query, dest);
        okCount++;
        console.log(`✓ public/images/${slug}/${filename}  (via ${PROVIDER}, query: "${img.query}")`);
      } catch (e) {
        failCount++;
        console.error(`✗ ${slug}/${filename} 失败: ${e.message}`);
      }
    }
  }
  console.log(`配图完成：成功 ${okCount} 张，失败 ${failCount} 张。`);
  console.log("提示: 运行 npm run check 校验图片引用是否完整。");
})();
