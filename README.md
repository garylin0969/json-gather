# JSON Gather 📊

一個收集各種資料的 JSON API 專案。所有資料都已轉換為繁體中文，透過 GitHub Pages 提供免費的 RESTful API 服務。

## 📑 目錄

-   [🚀 快速開始](#快速開始)
    -   [可用端點](#可用端點)
-   [📋 資料結構](#資料結構)
    -   [文案類資料](#文案類資料-搞笑文案騷話文案)
    -   [星座運勢資料](#星座運勢資料)
    -   [Google Maps 台北市牛肉麵店](#google-maps-台北市牛肉麵店)
    -   [圖片資源](#圖片資源)
-   [🔧 環境設定](#環境設定)
    -   [Google Maps API Key 設定](#google-maps-api-key-設定)

## 🚀 快速開始

基礎 URL：`https://garylin0969.github.io/json-gather/data/`

### 可用端點

| 端點                        | 描述                       | 資料筆數 | 更新頻率  |
| --------------------------- | -------------------------- | -------- | --------- |
| `funny-copywriting.json`    | 搞笑文案                   | 50 筆    | 每 6 小時 |
| `romantic-copywriting.json` | 騷話文案                   | 50 筆    | 每 6 小時 |
| `love-copywriting.json`     | 愛情文案                   | 50 筆    | 每 6 小時 |
| `horoscope.json`            | 當日星座運勢               | 12 星座  | 每 1 小時 |
| `taipei-beef-noodles.json`  | Google Maps 台北市牛肉麵店 | 不一定   | 每 5 天   |
| `images/gay/`               | 同志相關圖片               | 35 張    | 靜態檔案  |

## 📋 資料結構

### 文案類資料 (搞笑文案/騷話文案)

```json
{
    "type": "搞笑文案",
    "updated": "2025-07-24T00:35:32.665Z",
    "updateTime": "2025/7/24 上午8:35:32",
    "totalCount": 50,
    "targetCount": 50,
    "completionRate": "100.0%",
    "convertedToTraditional": true,
    "copywritings": [
        {
            "id": 1,
            "content": "結束友情的方式有許多種，最徹底的一種是借錢不還。",
            "length": 24,
            "addedAt": "2025-07-24T00:35:32.665Z"
        }
    ]
}
```

### 星座運勢資料

```json
{
    "updated": "2025-07-24T01:38:09.976Z",
    "updateTime": "2025/7/24 上午9:38:09",
    "totalConstellations": 12,
    "successCount": 12,
    "failureCount": 0,
    "processingTimeMs": 25331,
    "convertedToTraditional": true,
    "errors": [],
    "horoscopes": {
        "aries": {
            "constellation": "aries",
            "chineseName": "白羊座",
            "success": true,
            "code": "200",
            "msg": "獲取成功",
            "data": {
                "ji": "過度依賴他人",
                "yi": "午後小憩片刻",
                "all": "72%",
                "date": "2025-07-24",
                "love": "68%",
                "work": "65%",
                "money": "70%",
                "health": "82%",
                "notice": "內心有不少想法",
                "discuss": "76%",
                "lucky_star": "獅子座",
                "lucky_color": "青灰色",
                "lucky_number": "2"
            }
        }
    }
}
```

## 🌟 星座對照表

| 英文        | 中文   | 日期範圍      |
| ----------- | ------ | ------------- |
| aries       | 白羊座 | 3/21 - 4/19   |
| taurus      | 金牛座 | 4/20 - 5/20   |
| gemini      | 雙子座 | 5/21 - 6/21   |
| cancer      | 巨蟹座 | 6/22 - 7/22   |
| leo         | 獅子座 | 7/23 - 8/22   |
| virgo       | 處女座 | 8/23 - 9/22   |
| libra       | 天秤座 | 9/23 - 10/23  |
| scorpio     | 天蠍座 | 10/24 - 11/22 |
| sagittarius | 射手座 | 11/23 - 12/21 |
| capricorn   | 摩羯座 | 12/22 - 1/19  |
| aquarius    | 水瓶座 | 1/20 - 2/18   |
| pisces      | 雙魚座 | 2/19 - 3/20   |

### Google Maps 台北市牛肉麵店

```json
{
    "updated": "2025-08-04T12:20:50.005Z",
    "updateTime": "2025/8/4 下午8:20:50",
    "totalShops": 484,
    "processingTimeMs": 33799,
    "searchArea": {
        "northwest": {
            "lat": 25.0955,
            "lng": 121.4436
        },
        "southeast": {
            "lat": 25.0115,
            "lng": 121.6126
        },
        "gridSizeKm": 1.2
    },
    "districtStats": {
        "萬華區": 27,
        "信義區": 37,
        "中山區": 44,
        "大安區": 48,
        "中正區": 35,
        "南港區": 18,
        "松山區": 27,
        "未知區域": 167,
        "內湖區": 44,
        "士林區": 23,
        "大同區": 14
    },
    "errors": [],
    "shops": [
        {
            "id": "ChIJC9bmhw6pQjQRMzLaT4VIVCo",
            "name": "富宏牛肉麵",
            "rating": 4.2,
            "userRatingCount": 20179,
            "formattedAddress": "108台灣台北市萬華區洛陽街67號",
            "location": {
                "latitude": 25.0476197,
                "longitude": 121.50773579999998
            },
            "district": "萬華區"
        },
        {
            "id": "ChIJT5Lgu7yrQjQR-4z6kZ30ZOc",
            "name": "半島牛肉麵",
            "rating": 4.8,
            "userRatingCount": 14138,
            "formattedAddress": "110台灣台北市信義區忠孝東路五段215巷23號",
            "location": {
                "latitude": 25.0419245,
                "longitude": 121.57029109999999
            },
            "district": "信義區"
        }
    ]
}
```

### 圖片資源

#### 同志相關圖片

本專案提供同志相關的圖片資源，可透過以下方式存取：

-   **目錄瀏覽**：`https://garylin0969.github.io/json-gather/data/images/gay/`
-   **直接存取**：`https://garylin0969.github.io/json-gather/data/images/gay/gay1.jpg` 到 `gay20.jpg`

> 📸 **使用方式**：您可以直接在網頁或應用程式中使用這些圖片 URL，無需額外授權。

## 🔧 環境設定

### Google Maps API Key 設定

本專案使用 Google Places API 來抓取台北市牛肉麵店家資料。要讓此功能正常運作，您需要設定 `GOOGLE_MAPS_API_KEY` 環境變數。

#### 設定步驟：

1. **取得 Google Maps API Key**

    - 前往 [Google Cloud Console](https://console.cloud.google.com/)
    - 建立新專案或選擇現有專案
    - 啟用 Places API 服務
    - 在「憑證」頁面建立 API Key

2. **在 GitHub 中設定 Secrets**

    - 前往您的 GitHub 專案頁面
    - 點擊 `Settings` 標籤
    - 在左側選單中選擇 `Secrets and variables` → `Actions`
    - 點擊 `New repository secret`
    - 名稱輸入：`GOOGLE_MAPS_API_KEY`
    - 值輸入：您的 Google Maps API Key
    - 點擊 `Add secret` 儲存

3. **驗證設定**
    - 設定完成後，GitHub Actions 會自動使用此 API Key
    - 您可以在 Actions 頁面查看執行日誌確認是否正常運作

---

如果這個專案對您有幫助，請給個 ⭐ Star！
