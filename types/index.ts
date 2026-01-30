/**
 * @fileoverview 共用型別定義
 *
 * 定義專案中各腳本共用的介面和型別。
 */

// ============================================================================
// 通用型別
// ============================================================================

/**
 * API 回應的基本結構。
 *
 * @template T - 資料的型別
 */
export interface ApiResponse<T> {
    /** 是否成功 */
    success: boolean;
    /** 狀態碼 */
    code?: string | number;
    /** 訊息 */
    message?: string;
    /** 資料內容 */
    data: T | null;
    /** 錯誤訊息（當失敗時） */
    error?: string;
}

/**
 * 抓取結果的基本結構。
 *
 * @template T - 資料的型別
 */
export interface ScraperResult<T> {
    /** 更新時間（ISO 格式） */
    updated: string;
    /** 更新時間（台灣時區格式） */
    updateTime: string;
    /** 處理時間（毫秒） */
    processingTimeMs: number;
    /** 錯誤列表 */
    errors: string[];
    /** 資料內容 */
    data: T;
}

// ============================================================================
// 星座運勢相關型別
// ============================================================================

/** 星座英文名稱 */
export type ConstellationKey =
    | 'aries'
    | 'taurus'
    | 'gemini'
    | 'cancer'
    | 'leo'
    | 'virgo'
    | 'libra'
    | 'scorpio'
    | 'sagittarius'
    | 'capricorn'
    | 'aquarius'
    | 'pisces';

/** 星座運勢 API 回傳的原始資料 */
export interface HoroscopeApiData {
    /** 日期 */
    date?: string;
    /** 每日提醒 */
    notice?: string;
    /** 整體運勢評分 */
    all?: string;
    /** 愛情運勢評分 */
    love?: string;
    /** 工作運勢評分 */
    work?: string;
    /** 財運評分 */
    money?: string;
    /** 健康評分 */
    health?: string;
    /** 幸運顏色 */
    lucky_color?: string;
    /** 幸運數字 */
    lucky_number?: string;
    /** 幸運星座 */
    lucky_star?: string;
}

/** 單一星座的運勢資料 */
export interface HoroscopeItem {
    /** 星座英文名稱 */
    constellation: string;
    /** 星座中文名稱 */
    chineseName: string;
    /** 是否成功取得 */
    success: boolean;
    /** API 狀態碼 */
    code?: string;
    /** API 訊息 */
    msg?: string;
    /** 運勢資料 */
    data: HoroscopeApiData | null;
    /** 錯誤訊息（當失敗時） */
    error?: string;
}

/** 星座運勢的完整輸出結構 */
export interface HoroscopeOutput {
    /** 更新時間（ISO 格式） */
    updated: string;
    /** 更新時間（台灣時區格式） */
    updateTime: string;
    /** 星座總數 */
    totalConstellations: number;
    /** 成功數量 */
    successCount: number;
    /** 失敗數量 */
    failureCount: number;
    /** 處理時間（毫秒） */
    processingTimeMs: number;
    /** 是否已轉換為繁體 */
    convertedToTraditional: boolean;
    /** 錯誤列表 */
    errors: string[];
    /** 各星座運勢資料 */
    horoscopes: Record<string, HoroscopeItem>;
}

// ============================================================================
// 文案相關型別
// ============================================================================

/** 文案 API 配置 */
export interface CopywritingApiConfig {
    /** API 顯示名稱 */
    name: string;
    /** API URL */
    url: string;
    /** 回應中的資料鍵名 */
    responseKey: string;
    /** 輸出檔案名稱 */
    filename: string;
}

/** 單則文案 */
export interface CopywritingItem {
    /** 編號 */
    id: number;
    /** 文案內容 */
    content: string;
    /** 文案長度 */
    length: number;
    /** 新增時間 */
    addedAt: string;
}

/** 文案的完整輸出結構 */
export interface CopywritingOutput {
    /** 文案類型 */
    type: string;
    /** 更新時間（ISO 格式） */
    updated: string;
    /** 更新時間（台灣時區格式） */
    updateTime: string;
    /** 實際收集數量 */
    totalCount: number;
    /** 目標收集數量 */
    targetCount: number;
    /** 完成率 */
    completionRate: string;
    /** 是否已轉換為繁體 */
    convertedToTraditional: boolean;
    /** 文案列表 */
    copywritings: CopywritingItem[];
}

// ============================================================================
// 台北牛肉麵相關型別
// ============================================================================

/** 座標 */
export interface Coordinates {
    /** 緯度 */
    lat: number;
    /** 經度 */
    lng: number;
}

/** Google Places API 回傳的地點資料 */
export interface PlaceResult {
    /** 地點 ID */
    id: string;
    /** 地點名稱 */
    name: string;
    /** 顯示名稱物件 */
    displayName: {
        text: string;
        languageCode: string;
    };
    /** 評分 */
    rating?: number;
    /** 評論數量 */
    userRatingCount?: number;
    /** 格式化地址 */
    formattedAddress: string;
    /** 座標位置 */
    location: {
        latitude: number;
        longitude: number;
    };
    /** 所屬行政區 */
    district?: string;
}

/** Google Places 搜尋回應 */
export interface PlacesSearchResponse {
    /** 地點列表 */
    places: PlaceResult[];
    /** 下一頁 Token */
    nextPageToken?: string;
    /** 錯誤資訊 */
    error?: unknown;
}

/** 牛肉麵店家輸出的店家資料 */
export interface BeefNoodleShop {
    /** 地點 ID */
    id: string;
    /** 店家名稱 */
    name: string;
    /** 評分 */
    rating?: number;
    /** 評論數量 */
    userRatingCount?: number;
    /** 格式化地址 */
    formattedAddress: string;
    /** 座標位置 */
    location: {
        latitude: number;
        longitude: number;
    };
    /** 所屬行政區 */
    district?: string;
}

/** 台北牛肉麵的完整輸出結構 */
export interface BeefNoodleOutput {
    /** 更新時間（ISO 格式） */
    updated: string;
    /** 更新時間（台灣時區格式） */
    updateTime: string;
    /** 店家總數 */
    totalShops: number;
    /** 處理時間（毫秒） */
    processingTimeMs: number;
    /** 搜尋範圍 */
    searchArea: {
        northwest: Coordinates;
        southeast: Coordinates;
        gridSizeKm: number;
    };
    /** 各區店家數量統計 */
    districtStats: Record<string, number>;
    /** 錯誤列表 */
    errors: string[];
    /** 店家列表 */
    shops: BeefNoodleShop[];
}

// ============================================================================
// 台灣行事曆相關型別
// ============================================================================

/** 原始假日資料結構 */
export interface RawHoliday {
    西元日期: string;
    星期: string;
    是否放假: string;
    備註: string;
}

/** 轉換後的假日資料結構 */
export interface ProcessedHoliday {
    date: string;
    week: string;
    isHoliday: boolean;
    description: string;
}

// ============================================================================
// 星座運勢 API 內部型別 (用於 scripts/horoscope.ts)
// ============================================================================

/** API 原始回應格式 */
export interface HoroscopeApiResponse {
    code?: string | number;
    success?: boolean;
    msg?: string;
    message?: string;
    data?: {
        day?: HoroscopeApiData;
        tomorrow?: HoroscopeApiData;
        date?: string;
    } & HoroscopeApiData;
}

/** 標準化後的 API 回應 */
export interface NormalizedApiResponse {
    ok: boolean;
    code: string;
    msg: string;
    payload: HoroscopeApiData | null;
    date: string | null;
}

// ============================================================================
// 文案 API 內部型別 (用於 scripts/copywriting.ts)
// ============================================================================

/** 單一類型的處理結果 */
export interface TypeResult {
    success: boolean;
    count: number;
}
