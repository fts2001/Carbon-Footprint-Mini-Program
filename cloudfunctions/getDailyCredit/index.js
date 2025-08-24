const cloud = require("wx-server-sdk");

function todayStartDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async e => {
  const { OPENID } = cloud.getWXContext();
  const where = { _openid: OPENID };
  const now = todayStartDate();
  where.date = db.command.gt(now);
  if (e.type) where.type = e.type;

  let isFirst = false;
  const { data } = (await db.collection("dailyCredit").where(where).get()) || {};
  const totalCredit = data.reduce((acc, item) => acc + item.credit, 0);

  if (!totalCredit) {
    const type2Record = await db.collection("dailyCredit").where({ _openid: OPENID, type: e.type }).limit(1).get();
    isFirst = type2Record.data.length === 0;
  }

  return { totalCredit, isFirst };
};
