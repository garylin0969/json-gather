// scripts/copywriting.ts - 文案資料抓取
// 從多個API獲取愛情、搞笑、騷話文案資料
//
// 🎭 功能特色：
// - 抓取愛情文案、搞笑文案、騷話文案共三種類型
// - 每種類型收集100筆不重複資料
// - 自動重試機制確保資料完整性
// - 簡體字自動轉換為繁體字
// - 詳細的調試資訊輸出

import axios from 'axios';
import fs from 'fs';
import { Converter } from 'opencc-js';

// API 配置
const APIS = {
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

// 基礎配置
const TARGET_COUNT = 50; // 每種類型目標收集數量
const REQUEST_TIMEOUT = 10000; // 10秒超時
const RETRY_ATTEMPTS = 3; // 重試次數
const RETRY_DELAY = 2000; // 重試間隔（毫秒）
const REQUEST_DELAY = 1000; // 請求間隔，避免頻率過高

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

// 字串轉換為繁體
async function convertToTraditional(text: string): Promise<string> {
    if (!chineseConverter) {
        return text;
    }

    try {
        return await chineseConverter(text);
    } catch (error) {
        console.log('⚠️  字串轉換失敗，保持原文:', error);
        return text;
    }
}

// 獲取單筆文案資料
async function fetchSingleCopywriting(apiConfig: any, retryCount = 0): Promise<string | null> {
    try {
        const response = await axios.get(apiConfig.url, {
            timeout: REQUEST_TIMEOUT,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
                'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            },
        });

        if (response.data && response.data[apiConfig.responseKey]) {
            const originalText = response.data[apiConfig.responseKey];
            const convertedText = await convertToTraditional(originalText);
            return convertedText;
        } else {
            throw new Error(`API 返回格式錯誤: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (retryCount < RETRY_ATTEMPTS) {
            console.log(`🔄 ${apiConfig.name} 第 ${retryCount + 1} 次重試...`);
            await delay(RETRY_DELAY);
            return fetchSingleCopywriting(apiConfig, retryCount + 1);
        } else {
            console.log(`❌ ${apiConfig.name} 重試 ${RETRY_ATTEMPTS} 次後仍然失敗:`, errorMessage);
            return null;
        }
    }
}

// 收集指定數量的不重複文案
async function collectCopywriting(apiConfig: any): Promise<string[]> {
    console.log(`\n🎯 開始收集 ${apiConfig.name} 資料...`);
    console.log(`📊 目標數量: ${TARGET_COUNT} 筆`);

    const uniqueTexts = new Set<string>();
    const failedRequests: number[] = [];
    let totalRequests = 0;

    while (uniqueTexts.size < TARGET_COUNT && totalRequests < TARGET_COUNT * 3) {
        totalRequests++;
        const text = await fetchSingleCopywriting(apiConfig);

        if (text) {
            if (uniqueTexts.has(text)) {
                console.log(`⚠️  發現重複內容 (第${totalRequests}次請求)`);
            } else {
                uniqueTexts.add(text);
                console.log(
                    `✅ 收集成功 ${uniqueTexts.size}/${TARGET_COUNT} - ${text.substring(0, 30)}${
                        text.length > 30 ? '...' : ''
                    }`
                );
            }
        } else {
            failedRequests.push(totalRequests);
        }

        // 請求間隔
        await delay(REQUEST_DELAY);

        // 每10次請求顯示進度
        if (totalRequests % 10 === 0) {
            console.log(`📈 ${apiConfig.name} 進度: ${uniqueTexts.size}/${TARGET_COUNT} (已請求 ${totalRequests} 次)`);
        }
    }

    console.log(`\n📊 ${apiConfig.name} 收集完成:`);
    console.log(`  ✅ 成功收集: ${uniqueTexts.size} 筆`);
    console.log(`  📞 總請求次數: ${totalRequests} 次`);
    console.log(`  ❌ 失敗請求: ${failedRequests.length} 次`);

    return Array.from(uniqueTexts);
}

// 保存資料到JSON檔案
function saveCopywritingData(apiConfig: any, texts: string[]): void {
    const data = {
        type: apiConfig.name,
        updated: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalCount: texts.length,
        targetCount: TARGET_COUNT,
        completionRate: `${((texts.length / TARGET_COUNT) * 100).toFixed(1)}%`,
        convertedToTraditional: chineseConverter !== null,
        copywritings: texts.map((text, index) => ({
            id: index + 1,
            content: text,
            length: text.length,
            addedAt: new Date().toISOString(),
        })),
    };

    // 確保 data 目錄存在
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    const filePath = `data/${apiConfig.filename}`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 ${apiConfig.name} 資料已保存至: ${filePath}`);
}

// 主函數
(async () => {
    console.log('🎭 開始抓取文案資料...');
    console.log(`📅 執行時間: ${new Date().toLocaleString('zh-TW')}`);
    console.log(`🎯 目標: 每種類型收集 ${TARGET_COUNT} 筆不重複資料`);

    // 初始化簡體轉繁體轉換器
    try {
        await initializeConverter();
    } catch (error) {
        console.log('❌ 轉換器初始化失敗，將跳過簡繁轉換功能');
        console.log('💡 如需簡繁轉換，請檢查 opencc-js 套件是否正確安裝');
    }

    const startTime = Date.now();
    const results: Record<string, any> = {};

    // 逐個處理每種類型的文案
    for (const [key, apiConfig] of Object.entries(APIS)) {
        try {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`🎯 正在處理: ${apiConfig.name}`);
            console.log(`${'='.repeat(50)}`);

            const texts = await collectCopywriting(apiConfig);
            saveCopywritingData(apiConfig, texts);

            results[key] = {
                success: true,
                count: texts.length,
                completionRate: (texts.length / TARGET_COUNT) * 100,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`💥 處理 ${apiConfig.name} 時發生錯誤:`, error);

            results[key] = {
                success: false,
                count: 0,
                error: errorMessage,
            };
        }
    }

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    // 輸出最終統計
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 抓取結果統計');
    console.log(`${'='.repeat(60)}`);

    let totalSuccessCount = 0;
    let totalTargetCount = 0;

    for (const [key, apiConfig] of Object.entries(APIS)) {
        const result = results[key];
        const status = result.success ? '✅' : '❌';
        const rate = result.success ? `${result.completionRate.toFixed(1)}%` : '0%';

        console.log(`${status} ${apiConfig.name}: ${result.count}/${TARGET_COUNT} (${rate})`);

        if (result.success) {
            totalSuccessCount += result.count;
        }
        totalTargetCount += TARGET_COUNT;
    }

    console.log(
        `\n🎯 總計: ${totalSuccessCount}/${totalTargetCount} (${((totalSuccessCount / totalTargetCount) * 100).toFixed(
            1
        )}%)`
    );
    console.log(`🔤 簡繁轉換: ${chineseConverter ? '已啟用' : '已停用'}`);
    console.log(`⏱️  總處理時間: ${totalTime.toFixed(1)} 秒`);

    // 顯示部分範例內容
    if (totalSuccessCount > 0) {
        console.log('\n🌟 部分文案範例:');
        for (const [key, apiConfig] of Object.entries(APIS)) {
            if (results[key].success && results[key].count > 0) {
                try {
                    const filePath = `data/${apiConfig.filename}`;
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const samples = data.copywritings.slice(0, 2); // 顯示前2筆作為範例

                    console.log(`\n📝 ${apiConfig.name}:`);
                    samples.forEach((item: any, index: number) => {
                        console.log(`  ${index + 1}. ${item.content}`);
                    });
                } catch (error) {
                    console.log(`  無法讀取 ${apiConfig.name} 範例`);
                }
            }
        }
    }

    if (totalSuccessCount === totalTargetCount) {
        console.log('\n🎉 所有文案資料抓取完成！');
    } else if (totalSuccessCount > 0) {
        console.log('\n⚠️  部分文案資料抓取成功');
    } else {
        console.log('\n💥 所有文案資料抓取失敗，請檢查網路連接或API狀態');
        process.exit(1);
    }
})();
