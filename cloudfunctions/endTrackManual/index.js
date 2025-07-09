const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async event => {

  var carbSum = 0
  var speeds = 0

  const trackRes = await db
    .collection("track")
    .doc(event.curID)
    .update({
      data: {
        isManual: true,//手动输入数据的标志
        endTime: new Date(),
        endSteps: event.stepList ? event.stepList[30].step : null,
        weather: {}, // 温度
        carbSum, //省碳值
        purpose: event.purpose, //出行目的
        transport: event.transport, //用户选择的交通工具
        calcTransport: "", //计算出来的交通工具
        distance: event.dist, //行动距离km
        result: {} // 记录检测出来的值
      }
    });

  return { carbSum, trackRes, speeds };

};
