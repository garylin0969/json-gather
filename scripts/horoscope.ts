// scripts/horoscope.ts - 星座運勢資料抓取
// 從 suxun.site API 獲取當日所有星座運勢資料
//
// 🔮 功能特色：
// - 抓取全部12個星座的當日運勢
// - 包含運勢評分、幸運顏色、幸運數字等完整資訊
// - 自動重試機制確保資料完整性
// - 簡體字自動轉換為繁體字
// - 詳細的調試資訊輸出

import axios from 'axios';
import fs from 'fs';
import { Converter } from 'opencc-js';

// 星座配置：英文名稱對應中文名稱
const CONSTELLATIONS = {
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

// API 基礎配置
const API_BASE_URL = 'http://api.suxun.site/api/constellation';
const REQUEST_TIMEOUT = 10000; // 10秒超時
const RETRY_ATTEMPTS = 3; // 重試次數
const RETRY_DELAY = 2000; // 重試間隔（毫秒）

// 延遲函數
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 初始化簡體轉繁體轉換器
let chineseConverter: ((text: string) => Promise<string>) | null = null;

// 初始化轉換器函數
async function initializeConverter(): Promise<void> {
    try {
        console.log('🔄 正在初始化簡體轉繁體轉換器...');
        chineseConverter = await Converter({
            from: 'cn', // 簡體中文
            to: 'tw', // 繁體中文（台灣）
        });
        console.log('✅ 轉換器初始化成功');
    } catch (error) {
        console.log('❌ 轉換器初始化失敗:', error);
        throw error;
    }
}

// 遞迴轉換物件中的所有字串從簡體轉為繁體
async function convertObjectToTraditional(obj: any): Promise<any> {
    if (!chineseConverter) {
        console.log('⚠️  轉換器未初始化，跳過轉換');
        return obj;
    }

    if (typeof obj === 'string') {
        try {
            return await chineseConverter(obj);
        } catch (error) {
            console.log('⚠️  字串轉換失敗，保持原文:', error);
            return obj;
        }
    } else if (Array.isArray(obj)) {
        const convertedArray = [];
        for (const item of obj) {
            convertedArray.push(await convertObjectToTraditional(item));
        }
        return convertedArray;
    } else if (obj !== null && typeof obj === 'object') {
        const convertedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // 轉換鍵名
            const convertedKey = await chineseConverter(key);
            // 轉換值
            convertedObj[convertedKey] = await convertObjectToTraditional(value);
        }
        return convertedObj;
    }

    return obj;
}

// 解析並標準化 API 回應（同時兼容舊/新格式）
function normalizeApiResponse(
    raw: any,
    prefer: 'today' | 'nextday'
): { ok: boolean; code: string; msg: string; payload: any | null; date: string | null } {
    // 舊格式示例：{ code: '200', msg: '获取成功', data: { ...單日... } }
    if (raw && (raw.code === '200' || raw.code === 200) && (raw.msg || raw.message)) {
        const msg = raw.msg ?? raw.message;
        // 新格式示例：{ success: true, message: 'success', code: 200, data: { day: {...}, tomorrow: {...}, ... } }
        if (raw.success === true && raw.data && typeof raw.data === 'object' && (raw.data.day || raw.data.tomorrow)) {
            const block = prefer === 'nextday' ? raw.data.tomorrow : raw.data.day;
            const chosen = block ?? raw.data.day ?? raw.data.tomorrow ?? null;
            const date = chosen?.date ?? null;
            return { ok: true, code: String(raw.code), msg, payload: chosen, date };
        }

        // 舊格式：data 直接是單日資料
        if (raw.data && typeof raw.data === 'object' && !('day' in raw.data) && !('tomorrow' in raw.data)) {
            const date = raw.data?.date ?? null;
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
}

// 獲取單個星座運勢的函數（含重試機制）
async function fetchConstellationData(type: string, retryCount = 0): Promise<any> {
    try {
        console.log(`🔮 正在獲取 ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} (${type}) 的運勢...`);

        // 先嘗試獲取今天的運勢
        let response = await axios.get(API_BASE_URL, {
            params: {
                type: type,
                time: 'today',
            },
            timeout: REQUEST_TIMEOUT,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
                'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            },
        });

        // 兼容新/舊 API 回應
        const normalizedToday = normalizeApiResponse(response.data, 'today');

        if (normalizedToday.ok && normalizedToday.payload) {
            // 使用台灣時區的日期（Asia/Taipei）
            const today = new Date().toLocaleDateString('sv-SE', {
                timeZone: 'Asia/Taipei',
            }); // 格式: YYYY-MM-DD

            const returnedDate = normalizedToday.date;
            console.log(`📅 API回傳日期: ${returnedDate ?? '未知'}, 今日日期(台灣時區): ${today}`);

            let chosenPayload = normalizedToday.payload;
            let chosenMsg = normalizedToday.msg;
            let chosenCode = normalizedToday.code;

            // 若日期不符且回傳中同時包含 tomorrow，優先直接切換而不重發請求
            if (returnedDate && returnedDate !== today) {
                // 嘗試從同一份回應取 tomorrow
                const normalizedNext = normalizeApiResponse(response.data, 'nextday');
                if (normalizedNext.ok && normalizedNext.payload) {
                    const nextdayDate = normalizedNext.date ?? '未知';
                    console.log(`🔄 日期不匹配，改用回應中的 tomorrow 區塊。新日期: ${nextdayDate}`);
                    chosenPayload = normalizedNext.payload;
                    chosenMsg = normalizedNext.msg;
                    chosenCode = normalizedNext.code;
                } else {
                    // 仍保留舊行為：再請求一次 nextday
                    console.log(`🔄 回應中無 tomorrow 區塊，改為請求 time: nextday...`);
                    const nextdayResponse = await axios.get(API_BASE_URL, {
                        params: {
                            type: type,
                            time: 'nextday',
                        },
                        timeout: REQUEST_TIMEOUT,
                        headers: {
                            'User-Agent':
                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            Accept: 'application/json',
                            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
                        },
                    });
                    const normalizedNextByCall = normalizeApiResponse(nextdayResponse.data, 'nextday');
                    if (!normalizedNextByCall.ok || !normalizedNextByCall.payload) {
                        throw new Error(`API nextday請求失敗: ${JSON.stringify(nextdayResponse.data)}`);
                    }
                    console.log(
                        `✅ ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} nextday運勢獲取成功，新日期: ${
                            normalizedNextByCall.date ?? '未知'
                        }`
                    );
                    chosenPayload = normalizedNextByCall.payload;
                    chosenMsg = normalizedNextByCall.msg;
                    chosenCode = normalizedNextByCall.code;
                }
            } else {
                console.log(`✅ ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} 今天運勢獲取成功，日期匹配`);
            }

            // 轉換簡體字為繁體字 (使用最終選擇的 payload)
            console.log(`🔄 正在轉換 ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} 的簡體字為繁體字...`);
            const convertedData = await convertObjectToTraditional(chosenPayload);

            return {
                constellation: type,
                chineseName: CONSTELLATIONS[type as keyof typeof CONSTELLATIONS],
                success: true,
                code: chosenCode,
                msg: chineseConverter ? await chineseConverter(chosenMsg) : chosenMsg,
                data: convertedData,
            };
        }

        throw new Error(`API 返回失敗狀態: ${JSON.stringify(response.data)}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} 獲取失敗:`, errorMessage);

        // 如果還有重試機會
        if (retryCount < RETRY_ATTEMPTS) {
            console.log(`🔄 第 ${retryCount + 1} 次重試 ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]}...`);
            await delay(RETRY_DELAY);
            return fetchConstellationData(type, retryCount + 1);
        } else {
            console.log(
                `💥 ${CONSTELLATIONS[type as keyof typeof CONSTELLATIONS]} 重試 ${RETRY_ATTEMPTS} 次後仍然失敗`
            );
            // 返回錯誤資料結構，但不中斷整個流程
            return {
                constellation: type,
                chineseName: CONSTELLATIONS[type as keyof typeof CONSTELLATIONS],
                success: false,
                error: errorMessage,
                data: null,
            };
        }
    }
}

// 主函數
(async () => {
    console.log('🌟 開始抓取當日星座運勢資料...');
    console.log(`📅 目標日期: ${new Date().toLocaleDateString('zh-TW')}`);
    console.log(`🎯 目標星座: ${Object.keys(CONSTELLATIONS).length} 個`);

    // 初始化簡體轉繁體轉換器
    try {
        await initializeConverter();
    } catch (error) {
        console.log('❌ 轉換器初始化失敗，將跳過簡繁轉換功能');
        console.log('💡 如需簡繁轉換，請檢查 opencc-js 套件是否正確安裝');
    }

    const startTime = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];

    // 逐個獲取星座資料（避免同時請求過多造成API限制）
    for (const [englishName, chineseName] of Object.entries(CONSTELLATIONS)) {
        try {
            const data = await fetchConstellationData(englishName);
            results[englishName] = data;

            // 如果獲取失敗，記錄錯誤
            if (!data.success) {
                errors.push(`${chineseName} (${englishName}): ${data.error}`);
            }

            // 請求間隔，避免頻率過高
            await delay(500);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`💥 處理 ${chineseName} 時發生未預期錯誤:`, error);
            errors.push(`${chineseName} (${englishName}): 未預期錯誤 - ${errorMessage}`);
        }
    }

    const endTime = Date.now();
    const successCount = Object.values(results).filter((item: any) => item.success).length;
    const failureCount = Object.keys(CONSTELLATIONS).length - successCount;

    // 準備最終資料結構
    const finalData = {
        updated: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalConstellations: Object.keys(CONSTELLATIONS).length,
        successCount: successCount,
        failureCount: failureCount,
        processingTimeMs: endTime - startTime,
        convertedToTraditional: chineseConverter !== null, // 標記是否已進行簡繁轉換
        errors: errors,
        horoscopes: results,
    };

    // 確保 data 目錄存在
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    // 保存資料到 JSON 文件
    fs.writeFileSync('data/horoscope.json', JSON.stringify(finalData, null, 2), 'utf8');

    // 輸出結果摘要
    console.log('\n📊 抓取結果摘要:');
    console.log(`✅ 成功: ${successCount} 個星座`);
    console.log(`❌ 失敗: ${failureCount} 個星座`);
    console.log(`🔤 簡繁轉換: ${chineseConverter ? '已啟用' : '已停用'}`);
    console.log(`⏱️  總處理時間: ${(endTime - startTime) / 1000} 秒`);

    if (successCount > 0) {
        console.log('\n🌟 成功獲取的星座運勢:');
        Object.values(results)
            .filter((item: any) => item.success)
            .slice(0, 3) // 只顯示前3個作為範例
            .forEach((item: any) => {
                console.log(`${item.chineseName}: ${item.data.notice}`);
                console.log(`  整體運勢: ${item.data.all}`);
                console.log(`  愛情運勢: ${item.data.love}, 工作運勢: ${item.data.work}`);
                console.log(`  財運: ${item.data.money}, 健康: ${item.data.health}`);
                console.log(`  幸運顏色: ${item.data.lucky_color}, 幸運數字: ${item.data.lucky_number}`);
                console.log(`  幸運星座: ${item.data.lucky_star}`);
                console.log('---');
            });
    }

    if (errors.length > 0) {
        console.log('\n❌ 錯誤詳情:');
        errors.forEach((error) => console.log(`  ${error}`));
    }

    console.log(`\n💾 資料已保存至: data/horoscope.json`);

    if (successCount === Object.keys(CONSTELLATIONS).length) {
        console.log('🎉 所有星座運勢抓取完成！');
    } else if (successCount > 0) {
        console.log('⚠️  部分星座運勢抓取成功');
    } else {
        console.log('💥 所有星座運勢抓取失敗，請檢查網路連接或API狀態');
        process.exit(1);
    }
})();
