/**
 * @fileoverview 將原始假日資料轉換為應用程式所需格式的腳本。
 * 讀取 data/tw-calendar/raw 目錄下的 JSON 檔案，轉換欄位名稱並輸出至 data/tw-calendar/processed。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger, readJsonFile, writeJsonFile } from '../utils';
import type { RawHoliday, ProcessedHoliday } from '../types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../data/tw-calendar/raw');
const PROCESSED_DIR = path.join(__dirname, '../data/tw-calendar/processed');

/**
 * 將單筆原始假日資料轉換為目標格式。
 * @param raw 原始資料物件
 * @returns 轉換後的資料物件
 */
const convertHoliday = (raw: RawHoliday): ProcessedHoliday => ({
    date: raw.西元日期,
    week: raw.星期,
    isHoliday: raw.是否放假 === '2',
    description: raw.備註,
});

/**
 * 處理單一 JSON 檔案的轉換。
 * @param filename 檔案名稱
 */
const processFile = (filename: string): void => {
    try {
        const rawHolidays = readJsonFile<RawHoliday[]>(filename, RAW_DIR);
        const processed = rawHolidays.map(convertHoliday);
        writeJsonFile(filename, processed, PROCESSED_DIR);
        logger.success(`已轉換: ${filename}`);
    } catch (error) {
        logger.error(`轉換失敗: ${filename}`, error);
    }
};

/** 主程式入口。 */
const main = (): void => {
    if (!fs.existsSync(PROCESSED_DIR)) {
        fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }

    const files = fs.readdirSync(RAW_DIR).filter((file) => file.endsWith('.json'));

    if (files.length === 0) {
        logger.error('沒有找到任何 JSON 檔案');
        return;
    }

    files.forEach(processFile);
    logger.success(`完成！共轉換 ${files.length} 個檔案`);
};

main();
