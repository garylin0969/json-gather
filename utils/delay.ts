/**
 * @fileoverview 延遲工具函數模組
 *
 * 提供 Promise 形式的延遲功能，用於控制非同步操作的執行間隔。
 */

/**
 * 延遲指定毫秒數後解析的 Promise。
 *
 * @param ms - 要延遲的毫秒數
 * @returns 延遲完成後解析的 Promise
 *
 * @example
 * ```typescript
 * 延遲 1 秒
 * await delay(1000);
 *
 * 在迴圈中使用以控制請求頻率
 * for (const item of items) {
 *   await fetchData(item);
 *   await delay(500); // 每次請求間隔 500ms
 * }
 * ```
 */
export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
