/**
 * @fileoverview 文案資料抓取腳本
 *
 * 從多個 API 獲取愛情、搞笑、騷話等類型的文案資料，
 * 每種類型收集指定數量的不重複文案，並自動轉換為繁體中文。
 *
 * @example
 * ```bash
 * pnpm run scrape:copywriting
 * ```
 */

import axios from 'axios';

import type { CopywritingApiConfig, CopywritingItem, CopywritingOutput, TypeResult } from '../types';
import {
    delay,
    logger,
    writeJsonFile,
    readJsonFile,
    initializeChineseConverter,
    isConverterAvailable,
    convertToTraditional,
    getErrorMessage,
} from '../utils';

// ============================================================================
// 常數定義
// ============================================================================

/** API 配置列表 */
const API_CONFIGS: Record<string, CopywritingApiConfig> = {
    love: {
        name: '愛情文案',
        url: 'https://v.api.aa1.cn/api/api-wenan-aiqing/index.php?type=json',
        responseKey: 'text',
        filename: 'love-copywriting.json',
    },
    funny: {
        name: '搞笑文案',
        url: 'https://zj.v.api.aa1.cn/api/wenan-gaoxiao/?type=json',
        responseKey: 'msg',
        filename: 'funny-copywriting.json',
    },
    romantic: {
        name: '騷話文案',
        url: 'https://v.api.aa1.cn/api/api-saohua/index.php?type=json',
        responseKey: 'saohua',
        filename: 'romantic-copywriting.json',
    },
};

/** 基礎配置 */
const CONFIG = {
    TARGET_COUNT: 50,
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    REQUEST_DELAY: 1000,
    MAX_REQUEST_MULTIPLIER: 3,
} as const;

// ============================================================================
// 文案抓取函數
// ============================================================================

/**
 * 抓取單則文案。
 *
 * @param apiConfig - API 配置
 * @param retryCount - 目前重試次數
 * @returns 文案內容，失敗時返回 null
 */
const fetchCopywriting = async (apiConfig: CopywritingApiConfig, retryCount = 0): Promise<string | null> => {
    try {
        const response = await axios.get(apiConfig.url, {
            timeout: CONFIG.TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'application/json',
            },
        });

        const responseData = response.data as Record<string, unknown>;
        if (responseData && responseData[apiConfig.responseKey]) {
            const originalText = String(responseData[apiConfig.responseKey]);
            return await convertToTraditional(originalText);
        }

        throw new Error(`API 返回格式錯誤`);
    } catch {
        if (retryCount < CONFIG.MAX_RETRIES) {
            await delay(CONFIG.RETRY_DELAY);
            return fetchCopywriting(apiConfig, retryCount + 1);
        }
        return null;
    }
};

/**
 * 收集指定數量的不重複文案。
 *
 * @param apiConfig - API 配置
 * @returns 收集到的文案陣列
 */
const collectUniqueCopywritings = async (apiConfig: CopywritingApiConfig): Promise<string[]> => {
    logger.info(`收集 ${apiConfig.name}...`);

    const uniqueTexts = new Set<string>();
    const maxRequests = CONFIG.TARGET_COUNT * CONFIG.MAX_REQUEST_MULTIPLIER;
    let totalRequests = 0;

    while (uniqueTexts.size < CONFIG.TARGET_COUNT && totalRequests < maxRequests) {
        totalRequests++;
        const text = await fetchCopywriting(apiConfig);

        if (text && !uniqueTexts.has(text)) {
            uniqueTexts.add(text);
        }

        await delay(CONFIG.REQUEST_DELAY);

        // 每 25 次請求顯示進度
        if (totalRequests % 25 === 0) {
            logger.progress(uniqueTexts.size, CONFIG.TARGET_COUNT);
        }
    }

    logger.success(`${apiConfig.name}: ${uniqueTexts.size}/${CONFIG.TARGET_COUNT}`);
    return Array.from(uniqueTexts);
};

/**
 * 將文案資料儲存為 JSON 檔案。
 *
 * @param apiConfig - API 配置
 * @param texts - 文案內容陣列
 */
const saveCopywritingsToFile = (apiConfig: CopywritingApiConfig, texts: string[]): void => {
    const now = new Date();

    const outputData: CopywritingOutput = {
        type: apiConfig.name,
        updated: now.toISOString(),
        updateTime: now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalCount: texts.length,
        targetCount: CONFIG.TARGET_COUNT,
        completionRate: `${((texts.length / CONFIG.TARGET_COUNT) * 100).toFixed(1)}%`,
        convertedToTraditional: isConverterAvailable(),
        copywritings: texts.map(
            (text, index): CopywritingItem => ({
                id: index + 1,
                content: text,
                length: text.length,
                addedAt: now.toISOString(),
            }),
        ),
    };

    writeJsonFile(apiConfig.filename, outputData);
};

// ============================================================================
// 主程式
// ============================================================================

/**
 * 主函數：抓取所有類型的文案並儲存為 JSON 檔案。
 */
const main = async (): Promise<void> => {
    logger.info('開始抓取文案資料...');

    await initializeChineseConverter();

    const startTime = Date.now();
    const results: Record<string, TypeResult> = {};

    for (const [key, apiConfig] of Object.entries(API_CONFIGS)) {
        try {
            const texts = await collectUniqueCopywritings(apiConfig);
            saveCopywritingsToFile(apiConfig, texts);
            results[key] = { success: true, count: texts.length };
        } catch (error) {
            logger.error(`${apiConfig.name} 失敗`, getErrorMessage(error));
            results[key] = { success: false, count: 0 };
        }
    }

    const endTime = Date.now();
    let totalCount = 0;
    const totalTarget = Object.keys(API_CONFIGS).length * CONFIG.TARGET_COUNT;

    for (const result of Object.values(results)) {
        if (result.success) {
            totalCount += result.count;
        }
    }

    logger.info('統計結果:');
    logger.info(`總計: ${totalCount}/${totalTarget} (${((totalCount / totalTarget) * 100).toFixed(0)}%)`);
    logger.info(`耗時: ${((endTime - startTime) / 1000).toFixed(1)} 秒`);

    // 顯示範例
    if (totalCount > 0) {
        logger.info('範例:');
        for (const apiConfig of Object.values(API_CONFIGS)) {
            try {
                const data = readJsonFile<CopywritingOutput>(apiConfig.filename);
                if (data.copywritings.length > 0) {
                    logger.info(`${apiConfig.name}: ${data.copywritings[0].content}`);
                }
            } catch {
                // 忽略
            }
        }
    }

    if (totalCount === 0) {
        logger.error('所有文案抓取失敗');
        process.exit(1);
    }

    logger.success('文案抓取完成！');
};

main().catch((error) => {
    logger.error('程式執行失敗', error);
    process.exit(1);
});
