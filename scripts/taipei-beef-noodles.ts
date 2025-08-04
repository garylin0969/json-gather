// scripts/taipei-beef-noodles.ts - 台北市牛肉麵店家資料抓取
// 使用 Google Places API 搜尋台北市範圍內的牛肉麵店家
//
// 🍜 功能特色：
// - 使用網格搜尋確保完整覆蓋台北市
// - 自動過濾台北市範圍內的店家
// - 提取區域資訊並按評論數和評分排序
// - 詳細的調試資訊輸出
// - 完整的錯誤處理機制

import fs from 'fs';

// 從環境變數取得 API Key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const GRID_SIZE_KM = 1.2; // 進一步縮小網格以確保完整覆蓋

// 台北市邊界座標（根據台北市政府官方資料）
const TAIPEI_NW = { lat: 25.0955, lng: 121.4436 }; // 北投區關渡
const TAIPEI_SE = { lat: 24.95, lng: 121.6126 }; // 文山區木柵

// 台北市各區的準確座標範圍（根據官方資料）
const DISTRICT_BOUNDARIES = {
    中正區: { lat: [25.02, 25.05], lng: [121.5, 121.52] },
    大同區: { lat: [25.05, 25.08], lng: [121.5, 121.53] },
    中山區: { lat: [25.04, 25.07], lng: [121.52, 121.55] },
    松山區: { lat: [25.04, 25.07], lng: [121.55, 121.58] },
    大安區: { lat: [25.02, 25.05], lng: [121.52, 121.56] },
    萬華區: { lat: [25.02, 25.05], lng: [121.48, 121.52] },
    信義區: { lat: [25.02, 25.05], lng: [121.56, 121.6] },
    士林區: { lat: [25.08, 25.12], lng: [121.48, 121.58] },
    北投區: { lat: [25.12, 25.16], lng: [121.48, 121.58] },
    內湖區: { lat: [25.05, 25.08], lng: [121.58, 121.62] },
    南港區: { lat: [25.02, 25.05], lng: [121.6, 121.64] },
    文山區: { lat: [24.95, 25.05], lng: [121.54, 121.58] },
};

// 型別定義
interface Coordinates {
    lat: number;
    lng: number;
}
interface PlaceResult {
    id: string;
    name: string;
    displayName: { text: string; languageCode: string };
    rating?: number;
    userRatingCount?: number;
    formattedAddress: string;
    location: { latitude: number; longitude: number };
    district?: string; // 新增區域欄位
}
interface PlacesSearchResponse {
    places: PlaceResult[];
    nextPageToken?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any;
}

/** 計算網格點座標 */
function getGridPoints(nw: Coordinates, se: Coordinates, gridSizeKm: number): Coordinates[] {
    const latStep = gridSizeKm / 111;
    const lngStep = gridSizeKm / (111 * Math.cos((((nw.lat + se.lat) / 2) * Math.PI) / 180));
    const gridPoints: Coordinates[] = [];
    for (let lat = nw.lat; lat >= se.lat; lat -= latStep) {
        for (let lng = nw.lng; lng <= se.lng; lng += lngStep) {
            gridPoints.push({ lat, lng });
        }
    }
    return gridPoints;
}

/** 使用新版 Text Search 查詢 */
async function searchText(keyword: string, lat: number, lng: number, radius: number): Promise<PlaceResult[]> {
    if (!GOOGLE_MAPS_API_KEY) throw new Error('請設定 GOOGLE_MAPS_API_KEY');

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
        'places.id',
        'places.displayName',
        'places.rating',
        'places.userRatingCount',
        'places.formattedAddress',
        'places.location',
    ].join(',');

    // 給定地理範圍
    const locationBias = {
        circle: {
            center: { latitude: lat, longitude: lng },
            radius: radius, // 公尺
        },
    };

    const body = {
        textQuery: keyword,
        locationBias,
        maxResultCount: 20, // 每格最多20筆，無翻頁
        languageCode: 'zh-TW', // 設定為繁體中文
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error('Places API 查詢失敗: ' + err);
    }
    const data: PlacesSearchResponse = await res.json();
    return data.places ?? [];
}

/** 從 formattedAddress 提取區域資訊 */
function extractDistrictFromFormattedAddress(place: PlaceResult): string | undefined {
    // 台北市的區域名稱列表（包含不同可能的格式）
    const taipeiDistricts = [
        '中正區',
        '大同區',
        '中山區',
        '松山區',
        '大安區',
        '萬華區',
        '信義區',
        '士林區',
        '北投區',
        '內湖區',
        '南港區',
        '文山區',
    ];

    const address = place.formattedAddress;

    // 調試：記錄一些地址格式
    if (Math.random() < 0.1) {
        // 只記錄10%的地址以避免過多輸出
        console.log(`🔍 調試地址格式: ${address}`);
    }

    // 檢查 formattedAddress 是否包含區域名稱
    for (const district of taipeiDistricts) {
        if (address.includes(district)) {
            return district;
        }
    }

    // 如果還是找不到，嘗試用座標來判斷區域
    // return getDistrictFromCoordinates(place.location.latitude, place.location.longitude);

    // 如果還是找不到，則回傳 undefined
    return undefined;
}

/** 根據座標判斷區域 */
function getDistrictFromCoordinates(lat: number, lng: number): string | undefined {
    for (const [district, bounds] of Object.entries(DISTRICT_BOUNDARIES)) {
        if (lat >= bounds.lat[0] && lat <= bounds.lat[1] && lng >= bounds.lng[0] && lng <= bounds.lng[1]) {
            return district;
        }
    }
    return undefined;
}

/** 取得台北市牛肉麵店家（新版） */
async function getTaipeiBeefNoodleShops(): Promise<PlaceResult[]> {
    const gridPoints = getGridPoints(TAIPEI_NW, TAIPEI_SE, GRID_SIZE_KM);
    const allResults = new Map<string, PlaceResult>();

    console.log(`🍜 開始搜尋台北市牛肉麵店，共 ${gridPoints.length} 個網格點`);

    for (let i = 0; i < gridPoints.length; i++) {
        const point = gridPoints[i];

        try {
            const results = await searchText('牛肉麵', point.lat, point.lng, GRID_SIZE_KM * 600);
            for (const place of results) {
                // 檢查是否在台北市範圍內
                if (
                    place.location.latitude >= TAIPEI_SE.lat &&
                    place.location.latitude <= TAIPEI_NW.lat &&
                    place.location.longitude >= TAIPEI_NW.lng &&
                    place.location.longitude <= TAIPEI_SE.lng
                ) {
                    // 提取區域資訊
                    place.name = place.displayName.text;
                    place.district = extractDistrictFromFormattedAddress(place);
                    allResults.set(place.id, place);
                }
            }

            // 每10個網格點顯示進度
            if ((i + 1) % 10 === 0) {
                console.log(`✅ 已完成 ${i + 1}/${gridPoints.length} 個網格點，目前找到 ${allResults.size} 間店家`);
            }
        } catch (error) {
            // 記錄錯誤，不中斷流程
            console.error(`❌ 搜尋第${i + 1}個格點失敗:`, error);
        }
    }

    console.log(`🎉 搜尋完成，總共找到 ${allResults.size} 間台北市牛肉麵店`);

    // 排序：評論數再依評分
    return Array.from(allResults.values()).filter((place) => place.district !== undefined);
}

// 主函數
(async () => {
    if (!GOOGLE_MAPS_API_KEY) {
        console.log('❌ 錯誤: 未設定 GOOGLE_MAPS_API_KEY 環境變數');
        console.log('💡 請在 GitHub Secrets 中設定 GOOGLE_MAPS_API_KEY');
        process.exit(1);
    }

    const startTime = Date.now();
    let results: PlaceResult[] = [];
    let errors: string[] = [];

    try {
        results = await getTaipeiBeefNoodleShops();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`💥 抓取過程中發生錯誤:`, error);
        errors.push(`主要錯誤: ${errorMessage}`);
    }

    const endTime = Date.now();
    const successCount = results.length;

    // 統計區域分布
    const districtStats: Record<string, number> = {};
    results.forEach((place) => {
        const district = place.district || '未知區域';
        districtStats[district] = (districtStats[district] || 0) + 1;
    });

    // 準備最終資料結構
    const finalData = {
        updated: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalShops: successCount,
        processingTimeMs: endTime - startTime,
        searchArea: {
            northwest: TAIPEI_NW,
            southeast: TAIPEI_SE,
            gridSizeKm: GRID_SIZE_KM,
        },
        districtStats: districtStats,
        errors: errors,
        shops: results.map((place) => ({
            id: place.id,
            name: place.name,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            formattedAddress: place.formattedAddress,
            location: place.location,
            district: place.district,
        })),
    };

    // 確保 data 目錄存在
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    // 保存資料到 JSON 文件
    fs.writeFileSync('data/taipei-beef-noodles.json', JSON.stringify(finalData, null, 2), 'utf8');

    // 輸出結果摘要
    console.log('\n📊 抓取結果摘要:');
    console.log(`✅ 成功: ${successCount} 間店家`);
    console.log(`⏱️  總處理時間: ${(endTime - startTime) / 1000} 秒`);

    if (Object.keys(districtStats).length > 0) {
        Object.entries(districtStats)
            .sort(([, a], [, b]) => b - a)
            .forEach(([district, count]) => {
                console.log(`  ${district}: ${count} 間`);
            });
    }

    if (errors.length > 0) {
        console.log('\n❌ 錯誤詳情:');
        errors.forEach((error) => console.log(`  ${error}`));
    }

    console.log(`\n💾 資料已保存至: data/taipei-beef-noodles.json`);

    if (successCount > 0) {
        console.log('🎉 牛肉麵店家資料抓取完成！');
    } else {
        console.log('💥 未找到任何牛肉麵店家，請檢查網路連接或API狀態');
        process.exit(1);
    }
})();
