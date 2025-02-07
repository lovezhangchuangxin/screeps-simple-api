import { IRateLimit } from "./types/api";

/**
 * 调试输出
 */
export const debug = (...args: any[]) => {
  if ("__SCREEPS_DEBUG__" in globalThis) {
    console.log("[DEBUG] ", ...args);
  }
};

/**
 * 休眠函数
 * @param ms 毫秒数
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 构造默认速率限制
 * @param limit 限制次数
 * @param period 限制时间
 * @returns
 */
export const defaultLimit = (
  limit: number,
  period: "minute" | "hour" | "day"
): IRateLimit => ({
  limit,
  period,
  remaining: limit,
  reset: 0,
});
