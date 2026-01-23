# 接口文档 - 碳行家小程序 (Carbon Footprint Mini Program)

本文档详细说明了碳行家小程序中使用的云函数。
所有函数均部署在 `cloudfunctions` 目录下。

## 1. 用户与认证 (User & Authentication)

### `login`
- **用途**: 获取用户的微信 OpenID。
- **输入参数**: 无 (隐式获取上下文中的 `OPENID`)。
- **返回结果**: `{ data: { _openid: string } }`
- **数据库交互**: 无。

### `submituserinfo`
- **用途**: 在首次登录时保存用户信息，并初始化彩票/积分账户。
- **输入参数**:
    - `avatar`: string (头像URL)
    - `carbSum`: number (初始碳积累量，通常为 0)
    - `basicInfo`: object (用户个人资料信息)
    - `testGroup`: string (A/B 测试分组)
- **返回结果**: `{ success: boolean, error?: string }`
- **数据库交互**:
    - 写入 `userInfo` (更新或创建)
    - 创建 `lottery` 条目 (积分 = 0)
    - 创建 `relations` 条目

### `updateUserInfo`
- **用途**: 通用接口，用于更新用户统计数据、积分或碳积累量。也用于增加每日打卡积分。
- **输入参数**:
    - `credit`: number (增加的积分数量)
    - `carbon`: number (增加的节省碳量)
    - `firstStatus`: boolean (更新新手引导状态)
- **返回结果**: `{ errMsg: string, result?: string }`
- **数据库交互**:
    - 更新 `lottery` (积分)
    - 更新 `userInfo` (总碳量, 新手状态)
    - 读取 `track` (验证行程记录以确保积分合法性)

### `getphoneno`
- **用途**: 通过微信 API 解密并获取用户手机号。
- **输入参数**:
    - `code`: string (微信提供的临时 code)
- **返回结果**: `{ phoneNumber: string, message: string } | { error: string }`
- **数据库交互**:
    - 检查/写入 `phonenos` 集合。

## 2. 行程追踪与碳计算 (Tracking & Carbon Calculation)

### `createTrack`
- **用途**: 开始一个新的行程记录会话。
- **输入参数**:
    - `brand`, `model`, `system`, `platform`, `version`: 设备信息。
    - `startSteps`: number (当前步数)
    - `transport`: string (选择的交通方式)
    - `capacity`: string (排量，可选)
- **返回结果**: `_id` (string) 创建的行程记录ID。
- **数据库交互**: 在 `track` 集合创建文档。

### `updateTrack`
- **用途**: 向当前行程记录追加位置点。
- **输入参数**:
    - `curID`: string (行程 ID)
    - `recordItem`: object (位置点数据)
- **返回结果**: `true`
- **数据库交互**: 更新 `track` 集合 (push 到 `record` 数组)。

### `endTrack`
- **用途**: 结束行程会话，计算碳足迹，并判定交通方式。
- **输入参数**:
    - `curID`: string
    - `transport`: string (用户声明的交通方式)
    - `stepList`: array (微信步数数据)
    - `latitude`, `longitude`: number (结束位置，用于获取天气)
    - `purpose`: string (出行目的)
- **返回结果**: `{ carbSum: number, trackRes: object, speeds: array }`
- **数据库交互**:
    - 更新 `track` 文档，写入 `endTime` (结束时间), `carbSum` (碳排量), `result` (分析结果), `weather` (天气)。
    - 内部调用 `setweather` 函数。

### `getTrackRange`
- **用途**: 分析给定行程列表的交通方式占比 (通常用于历史记录视图)。
- **输入参数**:
    - `list`: array (待分析的行程记录列表)
- **返回结果**: 交通方式时间占比数组 (例如: `[{ label: "步行", percentage: "30%" }, ...]`)。
- **数据库交互**: 无 (纯计算，若配合 `findAbnormal` 使用则涉及读取)。

### `getLastTrack`
- **用途**: 获取最近的一次行程以检查状态。
- **输入参数**: 无。
- **返回结果**: 行程对象。

## 3. 积分、抽奖与商品 (Credits, Lottery & Merchandise)

### `getDailyCredit`
- **用途**: 检查今日获取的总积分，以及特定任务 (type 1/2) 是否完成。
- **输入参数**:
    - `type`: number (可选筛选类型)
- **返回结果**: `{ totalCredit: number, isFirst: boolean }`
- **数据库交互**: 读取 `dailyCredit`。

### `setDailyCredit`
- **用途**: 发放每日积分 (例如：通过阅读文章或积累省碳量)。
- **输入参数**:
    - `type`: number (积分来源类型)
    - `credit`: number
- **返回结果**: `{ success: boolean }`
- **数据库交互**: 写入 `dailyCredit`。

### `lottery`
- **用途**: 执行抽奖逻辑。
- **输入参数**:
    - `lottery_probability_id`: string (奖品ID)
    - `lottery_probability_name`: string
- **返回结果**: `{ success: boolean, message: string }`
- **数据库交互**:
    - 事务操作。
    - 扣除 `lottery` 积分。
    - 写入 `claimedprize`.

### `claimMerch`
- **用途**: 兑换实物商品。
- **输入参数**:
    - `merch_id`: string
    - `merch_name`: string
    - `price`: number (所需积分)
- **返回结果**: `{ success: boolean }`
- **数据库交互**:
    - 事务操作。
    - 检查 `merch` 库存。
    - 扣除 `lottery` 积分。
    - 写入 `claimedprize`。

### `exchangeCash`
- **用途**: 积分兑换现金 (红包)。
- **输入参数**:
    - `merch_id`: string
    - `price`: number (所需积分)
    - `cash_amount`: number (金额，单位：分)
    - `title`: string
- **返回结果**: `{ success: boolean, ticket: string, domain: string }`
- **数据库交互**:
    - 事务操作。
    - 扣除 `lottery` 积分。
    - 创建 `cashExchange` 记录。
    - 调用外部 API (`yaoyaola.net`) 获取红包 Ticket。

## 4. 其他工具 (Other Utilities)

### `sendNotification`
- **用途**: 发送订阅消息给用户。
- **输入参数**: `templateId`, `data` (模板数据)。
- **数据库交互**: 无 (调用微信 API)。

### `setweather`
- **用途**: 获取某位置的天气信息。
- **输入参数**: `latitude`, `longitude`。
- **返回结果**: 天气字符串/对象。

### `netCreate`
- **用途**: 创建社交/好友关系。
- **输入参数**: `senderID`, `receiverID`。

### `transfer`
- **用途**: 用户间积分/金额转账。
- **输入参数**: `money`, `remark`。

## 数据库结构 (推断)
1. **userInfo**: `_id`, `_openid`, `avatar`, `basicInfo`, `carbSum`, `testGroup`, `updateDate`.
2. **lottery**: `_id`, `_openid`, `credit`, `prizes`, `claimedprizes`.
3. **track**: `_id`, `_openid`, `record` (位置点数组), `transport`, `carbSum`, `date`, `result` (分析数据).
4. **dailyCredit**: `_id`, `_openid`, `type`, `credit`, `date`.
5. **merch**: `_id`, `merch_id`, `quantity`, `name`.
6. **claimedprize**: `_id`, `_openid`, `merch_id`/`lottery_probability_id`, `date`.
7. **cashExchange**: `_id`, `_openid`, `ticket`, `status`, `cash_amount`.
8. **phonenos**: `_id`, `_openid`, `phoneNumber`.
