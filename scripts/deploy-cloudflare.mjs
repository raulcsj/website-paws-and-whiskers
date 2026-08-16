#!/usr/bin/env node
// 一键部署到 Cloudflare Pages（纯静态导出）。跨平台（Windows/Mac/Linux 通用）。
// 用法: npm run deploy:cloudflare
import { execSync } from "child_process";
import path from "path";

// Cloudflare Pages 项目名只允许小写字母/数字/连字符；目录名可能含空格/中文/大写，统一清洗。
function toProjectName(name) {
  const cleaned = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/^-+|-+$/g, "");
  return cleaned || "site";
}

const PROJECT_NAME = toProjectName(path.basename(process.cwd()));

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

run("npm run check"); // 部署前先校验 frontmatter 与图片引用
run("npm run build"); // next build，output:"export" 会产出 out/ 静态目录
run("npx wrangler login"); // 首次需要浏览器授权，已登录会跳过

try {
  run(`npx wrangler pages project create "${PROJECT_NAME}" --production-branch=main`);
} catch {
  console.log("（项目已存在，跳过创建）");
}

run(`npx wrangler pages deploy out --project-name="${PROJECT_NAME}"`);
