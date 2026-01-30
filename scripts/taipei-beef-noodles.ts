/**
 * @fileoverview 台北市牛肉麵店家資料抓取腳本
 *
 * 使用 Google Places API 搜尋台北市範圍內的牛肉麵店家，
 * 透過網格搜尋確保完整覆蓋台北市區域。
 *
 * @example
 * ```bash
 * GOOGLE_MAPS_API_KEY=your_api_key pnpm run scrape:taipei-beef-noodles
 * ```
 */

import type { Coordinates, PlaceResult, PlacesSearchResponse, BeefNoodleShop, BeefNoodleOutput } from '../types';
import { logger, writeJsonFile, getErrorMessage } from '../utils';

// ============================================================================
// 常數定義
// ============================================================================

/** Google Maps API Key */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/** 搜尋配置 */
const SEARCH_CONFIG = {
    GRID_SIZE_KM: 1.2,
    RADIUS_MULTIPLIER: 600,
    MAX_RESULTS_PER_GRID: 20,
} as const;

/** 台北市邊界座標 */
const TAIPEI_BOUNDS = {
    NORTHWEST: { lat: 25.15, lng: 121.435 } as Coordinates,
    SOUTHEAST: { lat: 24.95, lng: 121.65 } as Coordinates,
} as const;

/** 台北市行政區列表 */
const TAIPEI_DISTRICTS = [
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
] as const;

/** 輸出檔案名稱 */
const OUTPUT_FILENAME = 'taipei-beef-noodles.json';

// ============================================================================
// 網格計算函數
// ============================================================================

/**
 * 計算搜尋網格點座標。
 *
 * @param northwest - 西北角座標
 * @param southeast - 東南角座標
 * @param gridSizeKm - 網格大小（公里）
 * @returns 網格中心點座標陣列
 */
const calculateGridPoints = (northwest: Coordinates, southeast: Coordinates, gridSizeKm: number): Coordinates[] => {
    const latStep = gridSizeKm / 111;
    const avgLat = (northwest.lat + southeast.lat) / 2;
    const lngStep = gridSizeKm / (111 * Math.cos((avgLat * Math.PI) / 180));

    const gridPoints: Coordinates[] = [];

    for (let lat = northwest.lat; lat >= southeast.lat; lat -= latStep) {
        for (let lng = northwest.lng; lng <= southeast.lng; lng += lngStep) {
            gridPoints.push({ lat, lng });
        }
    }

    return gridPoints;
};

// ============================================================================
// Google Places API 函數
// ============================================================================

/**
 * 使用 Google Places Text Search API 搜尋地點。
 *
 * @param keyword - 搜尋關鍵字
 * @param lat - 中心點緯度
 * @param lng - 中心點經度
 * @param radius - 搜尋半徑（公尺）
 * @returns 搜尋結果的地點陣列
 */
const searchPlacesByText = async (
    keyword: string,
    lat: number,
    lng: number,
    radius: number,
): Promise<PlaceResult[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('未設定 GOOGLE_MAPS_API_KEY');
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';

    const fieldMask = [
        'places.id',
        'places.displayName',
        'places.rating',
        'places.userRatingCount',
        'places.formattedAddress',
        'places.location',
    ].join(',');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify({
            textQuery: keyword,
            locationBias: {
                circle: {
                    center: { latitude: lat, longitude: lng },
                    radius,
                },
            },
            maxResultCount: SEARCH_CONFIG.MAX_RESULTS_PER_GRID,
            languageCode: 'zh-TW',
        }),
    });

    if (!response.ok) {
        throw new Error(`Places API 查詢失敗`);
    }

    const data: PlacesSearchResponse = await response.json();
    return data.places ?? [];
};

// ============================================================================
// 地址解析函數
// ============================================================================

/**
 * 從格式化地址中解析行政區。
 *
 * @param place - 地點資料
 * @returns 行政區名稱
 */
const parseDistrictFromAddress = (place: PlaceResult): string | undefined => {
    for (const district of TAIPEI_DISTRICTS) {
        if (place.formattedAddress.includes(district)) {
            return district;
        }
    }
    return undefined;
};

/**
 * 檢查地點是否在台北市範圍內。
 *
 * @param place - 地點資料
 * @returns 若在台北市範圍內返回 true
 */
const isWithinTaipeiBounds = (place: PlaceResult): boolean => {
    const { latitude, longitude } = place.location;
    return (
        latitude >= TAIPEI_BOUNDS.SOUTHEAST.lat &&
        latitude <= TAIPEI_BOUNDS.NORTHWEST.lat &&
        longitude >= TAIPEI_BOUNDS.NORTHWEST.lng &&
        longitude <= TAIPEI_BOUNDS.SOUTHEAST.lng
    );
};

// ============================================================================
// 主要搜尋函數
// ============================================================================

/**
 * 搜尋台北市所有牛肉麵店家。
 *
 * @returns 去重後的店家列表
 */
const searchTaipeiBeefNoodleShops = async (): Promise<PlaceResult[]> => {
    const gridPoints = calculateGridPoints(
        TAIPEI_BOUNDS.NORTHWEST,
        TAIPEI_BOUNDS.SOUTHEAST,
        SEARCH_CONFIG.GRID_SIZE_KM,
    );

    const uniqueShops = new Map<string, PlaceResult>();

    logger.info(`搜尋台北市牛肉麵店 (${gridPoints.length} 個網格)...`);

    for (let i = 0; i < gridPoints.length; i++) {
        const point = gridPoints[i];

        try {
            const results = await searchPlacesByText(
                '牛肉麵',
                point.lat,
                point.lng,
                SEARCH_CONFIG.GRID_SIZE_KM * SEARCH_CONFIG.RADIUS_MULTIPLIER,
            );

            for (const place of results) {
                if (!isWithinTaipeiBounds(place)) continue;

                place.name = place.displayName.text;
                place.district = parseDistrictFromAddress(place);
                uniqueShops.set(place.id, place);
            }

            // 每 20 個網格點顯示進度
            if ((i + 1) % 20 === 0) {
                logger.progress(i + 1, gridPoints.length, `${uniqueShops.size} 間店家`);
            }
        } catch {
            // 忽略單一網格錯誤
        }
    }

    return Array.from(uniqueShops.values()).filter((place) => place.district !== undefined);
};

// ============================================================================
// 主程式
// ============================================================================

/**
 * 主函數：搜尋台北市牛肉麵店家並儲存為 JSON 檔案。
 */
const main = async (): Promise<void> => {
    if (!GOOGLE_MAPS_API_KEY) {
        logger.error('未設定 GOOGLE_MAPS_API_KEY 環境變數');
        process.exit(1);
    }

    const startTime = Date.now();
    let results: PlaceResult[] = [];
    const errors: string[] = [];

    try {
        results = await searchTaipeiBeefNoodleShops();
    } catch (error) {
        errors.push(getErrorMessage(error));
    }

    const endTime = Date.now();

    // 統計各區店家數量
    const districtStats: Record<string, number> = {};
    for (const place of results) {
        const district = place.district || '未知';
        districtStats[district] = (districtStats[district] || 0) + 1;
    }

    const outputData: BeefNoodleOutput = {
        updated: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        totalShops: results.length,
        processingTimeMs: endTime - startTime,
        searchArea: {
            northwest: TAIPEI_BOUNDS.NORTHWEST,
            southeast: TAIPEI_BOUNDS.SOUTHEAST,
            gridSizeKm: SEARCH_CONFIG.GRID_SIZE_KM,
        },
        districtStats,
        errors,
        shops: results.map(
            (place): BeefNoodleShop => ({
                id: place.id,
                name: place.name,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                formattedAddress: place.formattedAddress,
                location: place.location,
                district: place.district,
            }),
        ),
    };

    const filePath = writeJsonFile(OUTPUT_FILENAME, outputData);

    logger.success(`完成: ${results.length} 間店家`);
    logger.info(`已保存至: ${filePath}`);

    // 顯示各區統計（前 5 名）
    if (Object.keys(districtStats).length > 0) {
        logger.info('各區統計:');
        Object.entries(districtStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([district, count]) => {
                logger.info(`${district}: ${count} 間`);
            });
    }

    if (results.length === 0) {
        logger.error('未找到任何店家');
        process.exit(1);
    }
};

main().catch((error) => {
    logger.error('程式執行失敗', error);
    process.exit(1);
});
