export function getDistance(lat1, lng1, lat2, lng2) {
  // 将经纬度从度数转换为弧度
  const toRadians = degree => (degree * Math.PI) / 180.0;

  // 地球半径，单位为千米
  const EARTH_RADIUS = 6378.137;

  // 将输入的纬度和经度转换为弧度
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);
  const deltaLat = radLat1 - radLat2;
  const deltaLng = toRadians(lng1) - toRadians(lng2);

  // 计算两点间的弧长
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2;
  const s = 2 * Math.asin(Math.sqrt(a));

  // 计算距离并四舍五入到小数点后4位
  const distance = (s * EARTH_RADIUS).toFixed(4);

  return parseFloat(distance);
}

export function roundToKM(num) {
  if (num <= 0) return 0;
  return Math.round((num / 1000) * 100) / 100;
}

export function todayStartDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: "gcj02",
      success: loc => {
        const latitude = loc.latitude.toFixed(2);
        const longitude = loc.longitude.toFixed(2);
        resolve({ latitude, longitude });
      },
      fail: err => {
        console.error("Error getting location:", err);
        reject(err);
      }
    });
  });
}

/**
 * @description: 根据省碳量计算积分
 * @return {*}
 */
export async function calcCredit(carbon: number) {
  if (!carbon) return { can: false, credit: 0 };

  let credit = 0;
  if (carbon >= 200) {
    // 200g以上-300分
    credit = 300;
  } else if (carbon >= 100) {
    // 100g以上-200分
    credit = 200;
  } else if (carbon >= 50) {
    // 50g以上-150分
    credit = 150;
  } else if (carbon >= 30) {
    // 30g以上-100分
    credit = 100;
  } else if (carbon >= 10) {
    // 10g以上-50分
    credit = 50;
  }

  const { result } = wx.cloud.callFunction({
    name: "getDailyCredit",
    data: {
      credit,
      type: 1
    }
  });

  const { can } = result || {};
  if (!can) credit = 0;

  return {
    can,
    credit
  };
}

/**
 * @description: 根据每日上限记录省碳量
 * @return {*}
 */
export async function calcDayCredit(carbon: number) {
  if (!carbon) return { can: false, credit: 0 };
  let credit = 100;

  const { result } = wx.cloud.callFunction({
    name: "getDailyCredit",
    data: {
      credit,
      type: 2
    }
  });

  const { can } = result || {};
  if (!can) credit = 0;

  return {
    can,
    credit
  };
}

/**
 * @description: 获取当前时间的小时和分钟
 * @return {*}
 */
export function getNowTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * @description: 判断2个时间戳之间的间距是否满足多少分钟
 * @param {number} timestamp1
 * @param {number} timestamp2
 * @param {number} distance
 * @return {*}
 */
export function isGreaterOrEqualMinutes(timestamp1: number, timestamp2: number, distance: number): boolean {
  // 计算两个时间戳的绝对差值（毫秒）
  const diff = Math.abs(timestamp1 - timestamp2);
  const minutesInMs = distance * 60 * 1000;

  // 判断差值是否大于等于3分钟
  return diff >= minutesInMs;
}

/**
 * 根据给定的概率返回 true 或 false
 * @param denominator 分母，表示 1/n 的概率返回 true
 * @returns 满足概率时返回 true，否则返回 false
 */
export function probability(denominator: number): boolean {
  if (denominator <= 1) {
    throw new Error("分母必须大于 1");
  }

  // 生成一个 [0, 1) 之间的随机数
  const randomValue = Math.random();

  // 计算概率阈值
  const threshold = 1 / denominator;

  // 如果随机数小于阈值，则返回 true
  return randomValue < threshold;
}
