/**
 * @fileoverview 統一日誌工具模組
 *
 * 提供結構化的日誌輸出功能，使用 emoji 圖示區分不同等級的訊息。
 */

/**
 * 日誌工具物件。
 *
 * 提供不同等級的日誌輸出方法，每個方法都會自動添加對應的 emoji 圖示。
 */
export const logger = {
    /**
     * 輸出成功訊息。
     *
     * @param message - 訊息內容
     * @param data - 可選的附加資料
     */
    success: (message: string, data?: unknown): void => {
        if (data !== undefined) {
            console.log(`✅ ${message}`, data);
        } else {
            console.log(`✅ ${message}`);
        }
    },

    /**
     * 輸出錯誤訊息。
     *
     * @param message - 訊息內容
     * @param data - 可選的附加資料
     */
    error: (message: string, data?: unknown): void => {
        if (data !== undefined) {
            console.log(`❌ ${message}`, data);
        } else {
            console.log(`❌ ${message}`);
        }
    },

    /**
     * 輸出一般資訊。
     *
     * @param message - 訊息內容
     * @param data - 可選的附加資料
     */
    info: (message: string, data?: unknown): void => {
        if (data !== undefined) {
            console.log(`ℹ️ ${message}`, data);
        } else {
            console.log(`ℹ️ ${message}`);
        }
    },

    /**
     * 輸出警告訊息。
     *
     * @param message - 訊息內容
     * @param data - 可選的附加資料
     */
    warn: (message: string, data?: unknown): void => {
        if (data !== undefined) {
            console.log(`⚠️ ${message}`, data);
        } else {
            console.log(`⚠️ ${message}`);
        }
    },

    /**
     * 輸出進度訊息。
     *
     * @param current - 目前進度
     * @param total - 總數
     * @param message - 可選的附加訊息
     */
    progress: (current: number, total: number, message?: string): void => {
        const percentage = ((current / total) * 100).toFixed(0);
        const output = message
            ? `${current}/${total} (${percentage}%) - ${message}`
            : `${current}/${total} (${percentage}%)`;
        console.log(`📊 ${output}`);
    },
};
