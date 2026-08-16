#!/usr/bin/env node
/**
 * 通过 GitHub API + Personal Access Token 自动创建仓库并推送。
 * 跨平台（Windows/Mac/Linux 通用，建仓推送只依赖 node/npm/git，不依赖 gh CLI）。
 *
 * 用法:
 *   npm run push:github -- <repo-name> [public|private] [--owner <org>] [--vercel-scope <team-slug>]
 *
 * - 仓库名会自动加 website- 前缀，例如 myblog → website-myblog
 * - token 读取顺序: 环境变量 GITHUB_TOKEN > 项目根目录 .env.local 里的 GITHUB_TOKEN
 * - token 只用于 API 调用与当次 push，不会写入 .git/config，也不会回显到终端
 * - 不传 --owner 时仓库创建在 token 所属账号下，传了则创建到该组织
 * - 若同时配置 VERCEL_TOKEN，推送后会尝试关联 Vercel 项目，并把 VERCEL_TOKEN / VERCEL_ORG_ID /
 *   VERCEL_PROJECT_ID 写入 GitHub Actions secrets（优先使用已登录的 gh CLI；没有 gh 则打印手动添加说明）。
 *   已配置 VERCEL_ORG_ID + VERCEL_PROJECT_ID 时会跳过 npx vercel link。
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const API = "https://api.github.com";

function parseArgs(argv) {
  let repo = null;
  let visibility = "public";
  let owner = null;
  let vercelScope = "";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--owner") {
      owner = argv[i + 1];
      i++;
    } else if (arg === "--vercel-scope") {
      vercelScope = argv[i + 1];
      i++;
    } else if (arg === "public" || arg === "private") {
      visibility = arg;
    } else if (!repo) {
      repo = arg;
    }
  }
  return { repo, visibility, owner, vercelScope };
}

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function gitConfig(name) {
  try {
    return execSync(`git config ${name}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function hasGitRepo() {
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hasHead() {
  try {
    execSync("git rev-parse --verify HEAD", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function currentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

async function ghApi(method, pathname, token, body) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  return { status: res.status, data };
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function hasGh() {
  try {
    const r = spawnSync("gh", ["--version"], { stdio: "ignore" });
    return !r.error && r.status === 0;
  } catch {
    return false;
  }
}

function setGhSecret(repoFull, name, value) {
  const r = spawnSync("gh", ["secret", "set", name, "--repo", repoFull], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
  return !r.error && r.status === 0;
}

function runWithEnv(cmd, env) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

function readVercelProjectJson() {
  const projectPath = path.join(process.cwd(), ".vercel", "project.json");
  if (!fs.existsSync(projectPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(projectPath, "utf8"));
  } catch {
    return null;
  }
}

async function setupVercel({ owner, repo, token, scope }) {
  const repoFull = `${owner}/${repo}`;
  let orgId = String(process.env.VERCEL_ORG_ID || "").trim();
  let projectId = String(process.env.VERCEL_PROJECT_ID || "").trim();

  if (!orgId || !projectId) {
    const args = ["vercel", "link", "--yes"];
    if (scope) args.push("--scope", scope);
    const cmd = `npx ${args.join(" ")}`;
    try {
      runWithEnv(cmd, { VERCEL_TOKEN: token });
    } catch (e) {
      fail(`Vercel 项目关联失败: ${e.message}（也可手动运行 npx vercel link，或先配置 VERCEL_ORG_ID / VERCEL_PROJECT_ID）`);
    }
    const project = readVercelProjectJson();
    if (!project || !project.orgId || !project.projectId) {
      fail("未能从 .vercel/project.json 读取 orgId / projectId，Vercel 关联未完成。");
    }
    orgId = project.orgId;
    projectId = project.projectId;
  }

  console.log(`Vercel 项目: org=${orgId} project=${projectId}`);

  const secrets = [
    ["VERCEL_TOKEN", token],
    ["VERCEL_ORG_ID", orgId],
    ["VERCEL_PROJECT_ID", projectId],
  ];

  if (hasGh()) {
    for (const [name, value] of secrets) {
      if (setGhSecret(repoFull, name, value)) {
        console.log(`✓ 已写入 GitHub Actions secret: ${name}`);
      } else {
        console.warn(`⚠ 写入 ${name} 失败，请手动添加。`);
      }
    }
    console.log(`✓ 已配置 ${repoFull} 的 GitHub Actions：以后每次 push main 会自动构建并部署到 Vercel。`);
  } else {
    console.log("\n未检测到 gh CLI（可选）。请手动到 GitHub 仓库 Settings → Secrets and variables → Actions 添加以下 3 个 secret：");
    console.log("  VERCEL_TOKEN = （你的 Vercel Access Token，敏感值，勿外泄）");
    console.log(`  VERCEL_ORG_ID = ${orgId}`);
    console.log(`  VERCEL_PROJECT_ID = ${projectId}`);
    console.log("添加后，每次 push main 都会自动部署到 Vercel。");
  }
}

(async () => {
  const { repo, visibility, owner, vercelScope } = parseArgs(process.argv.slice(2));
  if (!repo) {
    console.error("用法: npm run push:github -- <repo-name> [public|private] [--owner <org>] [--vercel-scope <team-slug>]");
    process.exit(1);
  }

  const base = String(repo).trim();
  const repoName = base.startsWith("website-") ? base : `website-${base}`;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repoName) || /^[.-]|[.-]$/.test(repoName)) {
    fail(`仓库名 "${repoName}" 不合法（只允许字母/数字/-/_/.，且不能以 . 或 - 开头结尾）`);
  }

  const token = (process.env.GITHUB_TOKEN || "").trim();
  if (!token) {
    console.error("✗ 未检测到 GITHUB_TOKEN。");
    console.error("  1. 创建 Personal Access Token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)，勾选 repo scope（或 fine-grained token 授予 Administration: write）");
    console.error("  2. 复制 .env.example 为 .env.local，加入一行: GITHUB_TOKEN=ghp_xxx");
    process.exit(1);
  }

  // 确定所属账号: 显式 --owner 优先，否则用 token 对应的登录用户
  let targetOwner = owner;
  if (!targetOwner) {
    const me = await ghApi("GET", "/user", token);
    if (me.status !== 200) {
      fail(`token 无效或已过期（GET /user 返回 ${me.status}: ${me.data?.message || "未知错误"}）`);
    }
    targetOwner = me.data.login;
  }

  console.log(`仓库: ${targetOwner}/${repoName}（${visibility}）`);

  // 仓库不存在才创建（GitHub 对无权限的仓库会返回 404，视为不存在）
  const existing = await ghApi("GET", `/repos/${targetOwner}/${repoName}`, token);
  if (existing.status === 200) {
    console.log(`仓库已存在: https://github.com/${targetOwner}/${repoName}`);
  } else if (existing.status === 404) {
    const createPath = owner ? `/orgs/${owner}/repos` : "/user/repos";
    const created = await ghApi("POST", createPath, token, {
      name: repoName,
      private: visibility === "private",
      description: "Generated static site by theme-site-generator",
    });
    if (created.status >= 300) {
      const msg = created.data?.message || created.data?.errors?.[0]?.message || "未知错误";
      if (created.status === 422 && String(msg).includes("already exists")) {
        console.log(`仓库已存在: https://github.com/${targetOwner}/${repoName}`);
      } else {
        fail(`创建仓库失败（${created.status}）: ${msg}（确认 token 有建仓库权限；组织仓库需是组织成员）`);
      }
    } else {
      console.log(`✓ 已创建仓库: https://github.com/${targetOwner}/${repoName}`);
    }
  } else {
    fail(`查询仓库失败（${existing.status}）: ${existing.data?.message || "未知错误"}`);
  }

  // 初始化 git（仅首次），统一主分支为 main，与 Cloudflare Pages 默认生产分支一致
  if (!hasGitRepo()) {
    run("git init");
  }
  if (currentBranch() !== "main") {
    run("git branch -M main");
  }
  if (!hasHead()) {
    if (!gitConfig("user.name") || !gitConfig("user.email")) {
      fail("git 未配置 user.name / user.email，无法提交。请先执行:\n  git config --global user.name \"你的名字\"\n  git config --global user.email \"you@example.com\"");
    }
    run("git add -A");
    run('git commit -m "init: generated site"');
  }

  // remote 用干净 URL；token 只通过当次 push 的 header 传入，不写入 .git/config
  const cleanRemote = `https://github.com/${targetOwner}/${repoName}.git`;
  let remoteUrl = "";
  try {
    remoteUrl = execSync("git remote get-url origin", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // origin 尚不存在
  }
  if (remoteUrl) {
    run(`git remote set-url origin ${cleanRemote}`);
  } else {
    run(`git remote add origin ${cleanRemote}`);
  }

  console.log("$ git push -u origin main（使用 GITHUB_TOKEN 认证，不写入 .git/config）");
  const pushed = spawnSync(
    "git",
    ["-c", `http.extraheader=Authorization: Bearer ${token}`, "push", "-u", "origin", "main"],
    { stdio: "inherit" }
  );
  if (pushed.error || pushed.status !== 0) {
    fail("推送失败。常见原因: 网络不通 / token 权限不足 / 远程已有不相关历史（需要先 git pull 或检查远程仓库）");
  }

  const vercelToken = String(process.env.VERCEL_TOKEN || "").trim();
  if (vercelToken) {
    await setupVercel({ owner: targetOwner, repo: repoName, token: vercelToken, scope: vercelScope });
  } else {
    console.log("\nVercel 自动部署（可选）：配置 VERCEL_TOKEN 后重新运行本命令，会自动关联 Vercel 项目并写入 GitHub Actions secrets。");
  }

  console.log(`✓ 已完成: https://github.com/${targetOwner}/${repoName}`);
  if (vercelToken) {
    console.log("已通过 GitHub Actions 配置 Vercel 自动部署（push main 即部署）。");
  } else {
    console.log("提示: 项目已内置 .github/workflows/deploy.yml；配置 VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID 三个 Actions secrets 后，push main 会自动部署到 Vercel（Cloudflare 仍需在面板导入一次）。");
  }
})();
