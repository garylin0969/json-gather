/**
 * @fileoverview 檔案操作工具模組
 *
 * 提供檔案系統相關的工具函數，包含目錄建立和 JSON 檔案寫入。
 */

import fs from 'fs';
import path from 'path';

/** 預設的資料輸出目錄 */
const DATA_DIRECTORY = 'data';

/**
 * 確保資料目錄存在。
 *
 * 若目錄不存在則自動建立。此函數使用同步方式執行，
 * 適合在腳本啟動時呼叫一次。
 *
 * @param directory - 目錄路徑，預設為 'data'
 *
 * @example
 * ```typescript
 * ensureDataDirectory();
 * // 或指定自訂目錄
 * ensureDataDirectory('output/json');
 * ```
 */
export const ensureDataDirectory = (directory: string = DATA_DIRECTORY): void => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
};

/**
 * 將資料寫入 JSON 檔案。
 *
 * 自動確保目標目錄存在，並以格式化的 JSON 格式寫入檔案。
 *
 * @param filename - 檔案名稱（不含路徑）
 * @param data - 要寫入的資料
 * @param directory - 目標目錄，預設為 'data'
 * @returns 完整的檔案路徑
 *
 * @example
 * ```typescript
 * const filePath = writeJsonFile('horoscope.json', horoscopeData);
 * console.log(`資料已寫入: ${filePath}`);
 * ```
 */
export const writeJsonFile = (filename: string, data: unknown, directory: string = DATA_DIRECTORY): string => {
    ensureDataDirectory(directory);
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
};

/**
 * 讀取 JSON 檔案內容。
 *
 * @param filename - 檔案名稱（不含路徑）
 * @param directory - 目標目錄，預設為 'data'
 * @returns 解析後的 JSON 資料
 * @throws 若檔案不存在或格式錯誤則拋出錯誤
 *
 * @example
 * ```typescript
 * const data = readJsonFile<HoroscopeData>('horoscope.json');
 * ```
 */
export const readJsonFile = <T>(filename: string, directory: string = DATA_DIRECTORY): T => {
    const filePath = path.join(directory, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
};
