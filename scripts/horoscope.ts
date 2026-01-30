/**
 * @fileoverview 星座運勢資料抓取腳本
 *
 * 從 suxun.site API 獲取當日所有 12 個星座的運勢資料，
 * 並自動將簡體中文轉換為繁體中文後儲存為 JSON 檔案。
 *
 * @example
 * ```bash
 * pnpm run scrape:horoscope
 * ```
 */

import axios from 'axios';

import type {
    ConstellationKey,
    HoroscopeApiData,
    HoroscopeItem,
    HoroscopeOutput,
    HoroscopeApiResponse,
    NormalizedApiResponse,
} from '../types';
import {
    delay,
    logger,
    writeJsonFile,
    initializeChineseConverter,
    isConverterAvailable,
    convertToTraditional,
    convertObjectToTraditional,
    getErrorMessage,
} from '../utils';

// ============================================================================
// 常數定義
// ============================================================================

/** 星座配置：英文名稱對應中文名稱 */
const CONSTELLATIONS: Record<ConstellationKey, string> = {
    aries: '白羊座',
    taurus: '金牛座',
    gemini: '雙子座',
    cancer: '巨蟹座',
    leo: '獅子座',
    virgo: '處女座',
    libra: '天秤座',
    scorpio: '天蠍座',
    sagittarius: '射手座',
    capricorn: '摩羯座',
    aquarius: '水瓶座',
    pisces: '雙魚座',
};

/** API 基礎設定 */
const API_CONFIG = {
    BASE_URL: 'http://api.suxun.site/api/constellation',
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    REQUEST_DELAY: 500,
} as const;

/** 輸出檔案名稱 */
const OUTPUT_FILENAME = 'horoscope.json';

// ============================================================================
// 型別定義
// ============================================================================

// ============================================================================
// API 處理函數
// ============================================================================

/**
 * 解析並標準化 API 回應。
 *
 * @param raw - API 原始回應
 * @param prefer - 優先取用的時間區段
 * @returns 標準化後的回應資料
 */
const parseHoroscopeApiResponse = (raw: HoroscopeApiResponse, prefer: 'today' | 'nextday'): NormalizedApiResponse => {
    if (raw && (raw.code === '200' || raw.code === 200) && (raw.msg || raw.message)) {
        const msg = raw.msg ?? raw.message ?? '';

        if (raw.success === true && raw.data && typeof raw.data === 'object' && (raw.data.day || raw.data.tomorrow)) {
            const block = prefer === 'nextday' ? raw.data.tomorrow : raw.data.day;
            const chosen = block ?? raw.data.day ?? raw.data.tomorrow ?? null;
            const date = chosen?.date ?? null;
            return { ok: true, code: String(raw.code), msg, payload: chosen, date };
        }

        if (raw.data && typeof raw.data === 'object' && !('day' in raw.data) && !('tomorrow' in raw.data)) {
            const date = raw.data.date ?? null;
            return { ok: true, code: String(raw.code), msg, payload: raw.data, date };
        }
    }

    return {
        ok: false,
        code: String(raw?.code ?? ''),
        msg: String(raw?.msg ?? raw?.message ?? ''),
        payload: null,
        date: null,
    };
};

/**
 * 取得台灣時區的當日日期字串。
 *
 * @returns 格式為 YYYY-MM-DD 的日期字串
 */
const getTaiwanDateString = (): string => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
};

/**
 * 抓取單一星座的運勢資料。
 *
 * @param constellationType - 星座英文名稱
 * @param retryCount - 目前重試次數
 * @returns 星座運勢資料
 */
const fetchHoroscopeByConstellation = async (
    constellationType: ConstellationKey,
    retryCount = 0,
): Promise<HoroscopeItem> => {
    const chineseName = CONSTELLATIONS[constellationType];

    try {
        const response = await axios.get<HoroscopeApiResponse>(API_CONFIG.BASE_URL, {
            params: { type: constellationType, time: 'today' },
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'application/json',
            },
        });

        const normalizedToday = parseHoroscopeApiResponse(response.data, 'today');

        if (!normalizedToday.ok || !normalizedToday.payload) {
            throw new Error(`API 返回失敗狀態`);
        }

        const todayDate = getTaiwanDateString();
        let chosenPayload = normalizedToday.payload;
        let chosenMsg = normalizedToday.msg;
        let chosenCode = normalizedToday.code;

        // 若日期不符，嘗試取用 tomorrow 區塊
        if (normalizedToday.date && normalizedToday.date !== todayDate) {
            const normalizedNext = parseHoroscopeApiResponse(response.data, 'nextday');

            if (normalizedNext.ok && normalizedNext.payload) {
                chosenPayload = normalizedNext.payload;
                chosenMsg = normalizedNext.msg;
                chosenCode = normalizedNext.code;
            } else {
                const nextdayResponse = await axios.get<HoroscopeApiResponse>(API_CONFIG.BASE_URL, {
                    params: { type: constellationType, time: 'nextday' },
                    timeout: API_CONFIG.TIMEOUT,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        Accept: 'application/json',
                    },
                });

                const normalizedNextByCall = parseHoroscopeApiResponse(nextdayResponse.data, 'nextday');
                if (!normalizedNextByCall.ok || !normalizedNextByCall.payload) {
                    throw new Error(`API nextday 請求失敗`);
                }

                chosenPayload = normalizedNextByCall.payload;
                chosenMsg = normalizedNextByCall.msg;
                chosenCode = normalizedNextByCall.code;
            }
        }

        const convertedData = await convertObjectToTraditional(chosenPayload);
        const convertedMsg = await convertToTraditional(chosenMsg);

        return {
            constellation: constellationType,
            chineseName,
            success: true,
            code: chosenCode,
            msg: convertedMsg,
            data: convertedData,
        };
    } catch (error) {
        const errorMessage = getErrorMessage(error);

        if (retryCount < API_CONFIG.MAX_RETRIES) {
            await delay(API_CONFIG.RETRY_DELAY);
            return fetchHoroscopeByConstellation(constellationType, retryCount + 1);
        }

        return {
            constellation: constellationType,
            chineseName,
            success: false,
            error: errorMessage,
            data: null,
        };
    }
};

// ============================================================================
// 主程式
// ============================================================================

/**
 * 主函數：抓取所有星座運勢並儲存為 JSON 檔案。
 */
const main = async (): Promise<void> => {
    logger.info('開始抓取星座運勢...');

    await initializeChineseConverter();

    const startTime = Date.now();
    const results: Record<string, HoroscopeItem> = {};
    const errors: string[] = [];

    for (const [englishName, chineseName] of Object.entries(CONSTELLATIONS)) {
        try {
            const data = await fetchHoroscopeByConstellation(englishName as ConstellationKey);
            results[englishName] = data;

            if (!data.success) {
                errors.push(`${chineseName}: ${data.error}`);
            }

            await delay(API_CONFIG.REQUEST_DELAY);
        } catch (error) {
            errors.push(`${chineseName}: ${getErrorMessage(error)}`);
        }
    }

    const endTime = Date.now();
    const successCount = Object.values(results).filter((item) => item.success).length;

    const outputData: HoroscopeOutput = {
        updated: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalConstellations: Object.keys(CONSTELLATIONS).length,
        successCount,
        failureCount: Object.keys(CONSTELLATIONS).length - successCount,
        processingTimeMs: endTime - startTime,
        convertedToTraditional: isConverterAvailable(),
        errors,
        horoscopes: results,
    };

    const filePath = writeJsonFile(OUTPUT_FILENAME, outputData);

    logger.success(`完成: ${successCount}/${Object.keys(CONSTELLATIONS).length} 個星座`);
    logger.info(`已保存至: ${filePath}`);

    if (successCount === 0) {
        logger.error('所有星座抓取失敗');
        process.exit(1);
    }
};

main().catch((error) => {
    logger.error('程式執行失敗', error);
    process.exit(1);
});
