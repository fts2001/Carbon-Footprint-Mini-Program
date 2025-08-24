const cloud = require("wx-server-sdk");

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { avatar, carbSum, basicInfo, testGroup } = event;
  const openid = wxContext.OPENID;

  try {
    const userRecord = await db
      .collection("userInfo")
      .where({
        _openid: openid
      })
      .get();

    return await db.runTransaction(async transaction => {
      if (userRecord.data.length > 0) {
        // User exists, update record
        const updateRes = await transaction
          .collection("userInfo")
          .doc(userRecord.data[0]._id)
          .update({
            data: {
              // _openid: openid,
              avatar: avatar,
              basicInfo: basicInfo,
              // carbSum: carbSum,
              // testGroup: testGroup,
              updateDate: new Date()
            }
          });
        if (!updateRes.stats.updated) {
          throw new Error("Update user info failed");
        }
      } else {
        // New user, create record
        const addRes = await transaction.collection("userInfo").add({
          data: {
            _openid: openid,
            avatar: avatar,
            basicInfo: basicInfo,
            carbSum: carbSum,
            loginDate: new Date(),
            updateDate: new Date(),
            testGroup: testGroup,
            firstStatus: true
          }
        });
        if (!addRes._id) {
          throw new Error("Add user info failed");
        }

        // Initiate lottery entry as well
        const lotteryEntry = {
          _openid: openid,
          credit: 0,
          prizes: [],
          claimedprizes: [],
          attempt: 0
        };
        const lotteryRes = await transaction.collection("lottery").add({
          data: lotteryEntry
        });
        if (!lotteryRes._id) {
          throw new Error("Add lottery entry failed");
        }
      }
      const connectionEntry = {
        openid: openid,
        friends: [openid]
      };
      const connectionRes = await transaction.collection("relations").add({
        data: connectionEntry
      });
      if (!connectionRes._id) {
        throw new Error("Add connection failed");
      }
      // Return true if successfully operated the commands
      return {
        success: true
      };
    });
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
};
