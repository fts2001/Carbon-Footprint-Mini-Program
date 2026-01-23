# 交接文档 - 碳行家小程序 (Carbon Footprint Mini Program)

## 1. 项目概览 (Project Overview)
**名称**: 碳行家 (Carbon Footprint Mini Program)
**目的**: 一个微信小程序，通过追踪用户的出行记录 (步行、驾驶、公共交通) 来计算碳足迹并奖励积分。积分可用于兑换实物商品或现金红包。
**技术栈**:
- **前端**: WeChat Mini Program (WXML, WXSS, TypeScript/JavaScript).
- **后端**: 微信云开发 (Cloud Functions, Cloud Database).
- **外部依赖**: `yaoyaola.net` API (用于红包发放).

## 2. 仓库结构 (Repository Structure)
项目遵循标准的微信小程序 + 云开发结构：

```
├── cloudfunctions/       # 后端逻辑 (Node.js)
│   ├── login/            # 认证
│   ├── createTrack/      # 开始行程
│   ├── endTrack/         # 结束行程 & 计算
│   ├── exchangeCash/     # 现金兑换
│   ├── ... (34+ 个函数)
├── miniprogram/          # 前端 UI
│   ├── pages/            # 页面视图 (Home, Login, PrizeCenter...)
│   ├── utils/            # 工具函数 (Time, Location, Colors)
│   ├── asset/            # 图片 & 图标
│   ├── app.json          # 全局配置
│   ├── app.ts            # App 生命周期
├── project.config.json   # 微信开发者工具配置
```

## 3. 核心流程与逻辑 (Key Workflows)

### 3.1 行程追踪 (Trip Tracking)
- **前端**: `pages/home/home.js`
    - 使用 `wx.startLocationUpdateBackground` 进行实时 GPS 定位。
    - 使用 `wx.getWeRunData` (需启用) 进行步数验证。
    - 每约 10 秒将数据点推送到 `updateTrack` 云函数。
- **后端**: `endTrack/index.js`
    - 使用 Haversine 公式计算距离。
    - 根据速度分段推测交通方式 (步行/骑行/汽车/火车)。
    - 计算节省碳量 (`carbSum`)。
    - 根据防作弊规则 (如速度限制) 进行验证。

### 3.2 积分与奖励 (Credits & Rewards)
- **货币**: 积分 (存储在 `lottery` 集合)。
- **获取**:
    - 每日出行 (>3km)。
    - 每日打卡逻辑 (`getDailyCredit`)。
- **消耗**:
    - **实物商品**: `claimMerch` 函数。检擦 `merch` 集合库存。
    - **现金**: `exchangeCash`。调用 `yaoyaola.net` 生成 ticket。用户被重定向到 webview 页面领取。

### 3.3 用户注册 (User Onboarding)
- **流程**: 登录 -> 授权信息 -> 授权位置 -> 新用户奖励。
- **逻辑**: `pages/login/login.ts` 触发 `submituserinfo`。
- **新用户奖励**: 自动调用 `sendCashReward` 给新用户发放 (通常是 0.3 元)。

## 4. 数据库结构 (Cloud Database)

| 集合名称 (Collection) | 关键字段 (Fields) | 用途 (Purpose) |
| :--- | :--- | :--- |
| `userInfo` | `_id`, `_openid`, `basicInfo`, `carbSum` | 用户资料 & 统计 |
| `lottery` | `_id`, `_openid`, `credit` | 用户积分余额 |
| `track` | `_id`, `record` (数组), `carbSum`, `transport` | 行程记录 |
| `merch` | `merch_id`, `quantity`, `price`, `type` | 商品库存 |
| `claimedprize` | `merch_id`, `date`, `_openid` | 兑换历史 |
| `cashExchange`| `orderid`, `ticket`, `status` | 现金兑换日志 |
| `dailyCredit` | `date`, `credit`, `type` | 每日积分日志 (防刷限制) |

## 5. 部署与维护 (Deployment & Maintenance)

### 5.1 环境设置
- 确保 `project.config.json` 指向正确的 `cloudfunctionRoot`。
- 在微信开发者工具中选择正确的云环境 (Dev/Prod)。

### 5.2 外部配置
- **Yaoyaola API**: 用于红包。
    - `exchangeCash` 和 `sendCashReward` 使用 `uid`, `apikey` (硬编码或配置)。
    - **重要**: 确保 `yaoyaola.net` 账户有余额。

### 5.3 常见问题
1. **追踪失败**: 通常由于权限被拒绝 (`scope.userLocationBackground`)。确保用户遵循 "打开设置" 提示。
2. **红包失败**:
    - 检查 `exchangeCash` 日志。
    - 检查 `yaoyaola` 余额是否充足。
    - 检查是否达到用户每日限额 (微信限制)。

## 6. 访问权限与账号
- **AppID**: `wxebadf544ddae62cb` (来自 `app.json` 嵌入列表，请核实 `project.config.json` 中的实际 AppID)。
- **云环境 ID**: 动态获取 (`cloud.DYNAMIC_CURRENT_ENV`).

## 7. 未来改进建议
- **重构**: 将 `endTrack` 中硬编码的速度阈值移至数据库配置。
- **安全**: 将外部 API 密钥移至云开发 `config` 或 Secret Manager，而不是代码中。
- **UI**: `home.js` 逻辑较重；考虑将追踪逻辑拆分到单独的 behavior 或 service 中。
