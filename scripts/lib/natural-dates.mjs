/**
 * 自然日期分配（纯函数、无副作用；供 generate-content.mjs 使用）。
 *
 * 目标：让文章时间戳看起来像真实更新节奏，而不是机器批量生成的规律间隔。
 * - 以"今天"为锚点：首次生成时最新一篇落在 1-3 天前；追加内容时最新一篇贴近今天
 * - 间隔随机：85% 为 1-14 天短间隔，15% 为 20-40 天"停更期"长间隔
 * - 追加场景：批次内所有日期必须晚于已有文章的最新日期，超出预算时按比例压缩
 * - diary 模式（content.config.json 里 dateMode: "diary"）：批次内用 1-3 天间隔，
 *   适合日记/游记这类按行程连续更新的系列；批次之间仍保留随机长间隔
 */

const DAY_MS = 86400000;

export function parseISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function daysBetween(a, b) {
  return Math.round((b - a) / DAY_MS);
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 85% 短间隔 1-14 天，15% 长间隔 20-40 天（模拟停更期）
function naturalGap() {
  return Math.random() < 0.85 ? randomInt(1, 14) : randomInt(20, 40);
}

/**
 * 生成 count 个升序日期（最旧在前）。
 * @param {number} count 需要分配日期的文章数
 * @param {object} [opts]
 * @param {Date|null} [opts.latest] 已有文章的最新日期；传入时新日期全部晚于它
 * @param {boolean} [opts.diary] 日记/游记模式：批次内间隔 1-3 天
 * @param {Date} [opts.now] 锚点时间，默认当前时间
 * @returns {Date[]}
 */
export function spreadDates(count, { latest = null, diary = false, now = new Date() } = {}) {
  if (!Number.isInteger(count) || count <= 0) return [];

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 锚点：批次最新一篇的日期
  let anchor;
  if (latest) {
    const since = Math.max(0, daysBetween(latest, today));
    if (since <= 3) {
      anchor = new Date(today);
    } else {
      anchor = addDays(today, -randomInt(1, 3));
    }
    if (anchor <= latest) anchor = addDays(latest, 1); // 新批次必须晚于已有最新
    if (anchor > today) anchor = new Date(today); // 不写未来日期
  } else {
    anchor = addDays(today, -randomInt(1, 3));
  }

  const gaps = [];
  for (let i = 1; i < count; i++) {
    gaps.push(diary ? randomInt(1, 3) : naturalGap());
  }

  // 追加场景：批次最早一篇不能早于已有最新日期；超出预算时按比例压缩间隔
  if (latest) {
    const budget = Math.max(0, daysBetween(latest, anchor));
    const total = gaps.reduce((a, b) => a + b, 0);
    if (total > budget) {
      const scale = budget / total;
      let used = 0;
      for (let i = 0; i < gaps.length; i++) {
        if (i === gaps.length - 1) {
          gaps[i] = Math.max(0, budget - used);
        } else {
          gaps[i] = Math.max(0, Math.round(gaps[i] * scale));
          used += gaps[i];
        }
      }
    }
  }

  const dates = [anchor];
  for (let i = 1; i < count; i++) {
    dates.push(addDays(dates[i - 1], -gaps[i - 1]));
  }
  return dates; // 升序：最旧在前，最新在后
}
