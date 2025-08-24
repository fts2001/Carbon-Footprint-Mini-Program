const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async e => {
  const { OPENID } = cloud.getWXContext();
  // type 1-省碳 2-阅读
  const { type, credit } = e;

  try {
    // Start a transaction
    const transaction = await db.startTransaction();

    await transaction.collection("dailyCredit").add({
      data: {
        type,
        _openid: OPENID,
        credit: credit,
        date: new Date()
      }
    });

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
      message: "DailyCredit Added"
    };
  } catch (error) {
    console.error("Error adding DailyCredit:", error);

    // Rollback the transaction if any error occurs
    await transaction.rollback();

    return {
      success: false,
      message: error.message
    };
  }

  // // type 1-根据省碳量计算积分 2-根据每日上限记录省碳量
  // const { type, credit } = e;
  // const max1 = 300;
  // const max2 = 200;
  // let can = true;

  // try {
  //   // Start a transaction
  //   const transaction = await db.startTransaction();

  //   const { data } =
  //     (await transaction
  //       .collection("dailyCredit")
  //       .where({ _openid: OPENID, date: _.gt(today) })
  //       .get()) || {};
  //   const total = data.reduce((acc, item) => acc + item.credit, 0);

  //   if (type === 1 && total >= max1) can = false;
  //   if (total >= max2 && total >= max2) can = false;

  //   if (can) {
  //     await transaction.collection("dailyCredit").add({
  //       data: {
  //         _openid: OPENID,
  //         credit: credit,
  //         date: new Date()
  //       }
  //     });
  //   }

  //   // Commit the transaction
  //   await transaction.commit();

  //   return {
  //     can,
  //     success: true,
  //     message: "DailyCredit Added"
  //   };
  // } catch (error) {
  //   console.error("Error adding DailyCredit:", error);

  //   // Rollback the transaction if any error occurs
  //   await transaction.rollback();

  //   return {
  //     can: false,
  //     success: false,
  //     message: error.message
  //   };
  // }
};
