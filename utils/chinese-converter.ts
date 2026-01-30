/**
 * @fileoverview 簡繁中文轉換工具模組
 *
 * 封裝 opencc-js 函式庫，提供簡體中文轉繁體中文（台灣）的功能。
 * 使用單例模式管理轉換器實例。
 */

import { Converter } from 'opencc-js';

/** 簡繁轉換器函數型別 */
type ChineseConverterFn = (text: string) => Promise<string>;

/** 轉換器單例實例 */
let converterInstance: ChineseConverterFn | null = null;

/** 轉換器初始化狀態 */
let isInitialized = false;

/**
 * 初始化簡繁轉換器。
 *
 * @returns 初始化成功返回 true，否則返回 false
 */
export const initializeChineseConverter = async (): Promise<boolean> => {
    if (isInitialized) {
        return converterInstance !== null;
    }

    try {
        converterInstance = await Converter({ from: 'cn', to: 'tw' });
        isInitialized = true;
        return true;
    } catch {
        isInitialized = true;
        converterInstance = null;
        return false;
    }
};

/**
 * 檢查轉換器是否可用。
 *
 * @returns 轉換器可用返回 true，否則返回 false
 */
export const isConverterAvailable = (): boolean => {
    return converterInstance !== null;
};

/**
 * 將簡體中文字串轉換為繁體中文。
 *
 * @param text - 要轉換的簡體中文字串
 * @returns 轉換後的繁體中文字串
 */
export const convertToTraditional = async (text: string): Promise<string> => {
    if (!converterInstance) {
        return text;
    }

    try {
        return await converterInstance(text);
    } catch {
        return text;
    }
};

/**
 * 遞迴將物件中的所有字串從簡體轉換為繁體。
 *
 * @param obj - 要轉換的物件、陣列或字串
 * @returns 轉換後的資料
 */
export const convertObjectToTraditional = async <T>(obj: T): Promise<T> => {
    if (!converterInstance) {
        return obj;
    }

    if (typeof obj === 'string') {
        try {
            return (await converterInstance(obj)) as T;
        } catch {
            return obj;
        }
    }

    if (Array.isArray(obj)) {
        const convertedArray: unknown[] = [];
        for (const item of obj) {
            convertedArray.push(await convertObjectToTraditional(item));
        }
        return convertedArray as T;
    }

    if (obj !== null && typeof obj === 'object') {
        const convertedObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const convertedKey = await converterInstance(key);
            convertedObj[convertedKey] = await convertObjectToTraditional(value);
        }
        return convertedObj as T;
    }

    return obj;
};
