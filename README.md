# JSON Gather 📊

一個收集各種資料的 JSON API 專案。所有資料都已轉換為繁體中文，透過 GitHub Pages 提供免費的 RESTful API 服務。

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

---

如果這個專案對您有幫助，請給個 ⭐ Star！
