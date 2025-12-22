const cloud = require("wx-server-sdk");

// Initialize cloud
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async e => {
  const { OPENID } = cloud.getWXContext();
  const { eventName, params } = e;

  try {
    // Start a transaction
    const transaction = await db.startTransaction();

    await transaction.collection("eventTrack").add({
      data: {
        eventName,
        _openid: OPENID,
        date: new Date(),
        params: params || {}
      }
    });

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
      message: "EventTrack Added"
    };
  } catch (error) {
    console.error("Error adding EventTrack:", error);

    // Rollback the transaction if any error occurs
    await transaction.rollback();

    return {
      success: false,
      message: error.message
    };
  }
};
