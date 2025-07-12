const cloud = require("wx-server-sdk");

cloud.init();

const db = cloud.database();
const _ = db.command;

const labels = [
  {
    label: "步行/跑步",
    value: "walk"
  },
  {
    label: "骑行",
    value: "bike"
  },
  {
    label: "火车",
    value: "train"
  },
  {
    label: "公交车（市区）",
    value: "bus"
  },
  {
    label: "汽车",
    value: "car"
  }
];

exports.main = async event => {
  // const calcTransport = labels.find(item => item.value === event.prediction)?.label || "未知速度";

  // await db.collection("track").doc(event.curID).update({ data: { calcTransport } });

  return true;
};
