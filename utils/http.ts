/**
 * @fileoverview HTTP 請求工具模組
 */

/**
 * 從錯誤物件中提取錯誤訊息。
 *
 * @param error - 錯誤物件
 * @returns 錯誤訊息字串
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};
