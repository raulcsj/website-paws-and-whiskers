#!/usr/bin/env node
// 一键部署到 Vercel。跨平台（Windows/Mac/Linux 通用，只依赖 node/npm，不依赖 bash）。
// 用法: npm run deploy:vercel
import { execSync } from "child_process";

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

run("npm run check"); // 部署前先校验 frontmatter 与图片引用
try {
  run("npx vercel --prod");
} catch (e) {
  console.error("部署失败，检查是否已 `npx vercel login` 授权过。");
  process.exit(1);
}
