function getWeekRange() {
  const currentDate = new Date();
  const first = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1);
  const last = first + 6;

  const firstDayOfWeek = new Date(currentDate.setDate(first)).setHours(0, 0, 0, 0);
  const lastDayOfWeek = new Date(currentDate.setDate(last)).setHours(23, 59, 59, 999);

  return { firstDayOfWeek, lastDayOfWeek };
}

function formatTime(time: number) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hour = padZero(date.getHours());
  const minute = padZero(date.getMinutes());
  const formattedTime = `${year}-${month}-${day} ${hour}:${minute}`;
  return formattedTime;
}

function padZero(num: number) {
  return num < 10 ? "0" + num : num;
}

/**
 * @description: 多少s触发
 * @param {function} callback
 * @return {*}
 */
function createTimer(callback: () => void, second: number): () => void {
  const timeoutId = setTimeout(() => {
    callback();
  }, second * 1000); // 5000毫秒 = 5秒

  // 返回清除函数，允许提前清除计时器
  return () => {
    clearTimeout(timeoutId);
  };
}

function createCountdownTimer(startDate: string, daysUntilExpiry: number = 3) {
  // 将开始日期转换为Date对象
  const start = new Date(startDate);

  // 计算过期日期（开始日期 + 指定天数，保持相同的时间）
  const expiryDate = new Date(start);
  expiryDate.setDate(start.getDate() + daysUntilExpiry);

  // 返回一个函数，每次调用返回剩余时间信息
  return function () {
    const now = new Date();
    const timeRemaining = (expiryDate as any) - (now as any);

    // 如果已过期
    if (timeRemaining <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      };
    }

    // 计算剩余时间
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return {
      expired: false,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor(timeRemaining / 1000)
    };
  };
}

export { createCountdownTimer, createTimer, formatTime, getWeekRange };
