import { updateColor } from "../../utils/colorschema";
import { logEvent } from "../../utils/log";
import { onCheckSignIn, updateUserData } from "../../utils/login";
const app = getApp();

Page({
  data: {
    credits: 0,
    prizes: [],
    prizeList: [],
    claimedprizes: [],
    isFromShareTimeline: true,
    background: null
  },

  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData() {
    // 异步处理数据初始化录入
    const initialize = async () => {
      try {
        // 未登录用户直接返回
        if (!onCheckSignIn()) {
          return;
        }

        // 初始化奖品数据
        this.getMerchData();
      } catch (error) {
        console.error("Information页面初始化错误", error);
        this.initData.executed = false;
      }
    };

    // 让该函数只能初始化一次
    if (!this.initData.executed) {
      initialize();
      this.initData.executed = true;
    } else {
      console.log("Information页面已经初始化过了！");
    }
  },
  onReady() {},
  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (options.isFromShareTimeline) {
      wx.redirectTo({
        url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
        success: () => {
          this.setData({
            isFromShareTimeline: false
          });
        }
      });
      return;
    } else {
      this.setData({
        isFromShareTimeline: false
      });
    }
  },

  onShow() {
    this.getTabBar();
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) {
      return;
    }

    // 更新颜色
    updateColor();

    // 检查登录状态
    updateUserData();
    onCheckSignIn({
      message: "请您登录",
      success: () => {
        // 初始化数据
        this.initData();

        // 获取Lottery信息
        this.getLotteryInfo();
      }
    });
  },

  async getMerchData() {
    try {
      const db = wx.cloud.database();
      let res = await db.collection("merch").get();
      console.log(res);
      // Map data excluding quantity
      const prizes = res.data
        .filter(item => {
          return item?.attribute !== "lottery";
        })
        .map(item => ({
          merch_id: item.merch_id,
          image: item.image_url,
          title: item.title,
          description: item.descp_short,
          longDescription: item.descp_full,
          price: item.price
        }));
      // set local storage
      wx.setStorageSync("prizes", prizes);
      // Update local state
      this.setData({ prizes });
    } catch (err) {
      console.log(err);
    }
  },

  navigateToMerchs: function (e) {
    const merchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchDetail/merchDetail?merch_id=${merchId}`
    });
    console.log(merchId);
  },

  navigateToLottery: function () {
    onCheckSignIn({
      message: "使用此功能需登录",
      success: () => {
        wx.navigateTo({
          // url: '/pages/store/store'
          url: "/pages/pointsPrize/pointsPrize?type=2"
        });
      }
    });
  },

  navigateToPrizes: function () {
    onCheckSignIn({
      message: "使用此功能需登录",
      success: () => {
        var prizelist = JSON.stringify(this.data.prizeList);
        var claimedprizes = JSON.stringify(this.data.claimedprizes);

        wx.navigateTo({
          url: "/pages/myprize/myprize?prizelist=" + prizelist + "&claimedprizes=" + claimedprizes
        });
      }
    });
  },

  async getLotteryInfo() {
    wx.showToast({
      title: "数据更新中",
      icon: "loading",
      mask: true,
      duration: 10000
    });
    const db = wx.cloud.database();
    console.log("the openid is ", app.globalData.openID);
    try {
      db.collection("lottery")
        .where({
          _openid: app.globalData.openID
        })
        .watch({
          onChange: snapshot => {
            console.log("docs's changed events", snapshot.docChanges[0]);
            console.log("query result snapshot after the event", snapshot.docs[0]);
            this.setData({
              credits: snapshot.docs[0].credit,
              _id: snapshot.docs[0]._id,
              attempts: snapshot.docs[0].attempts,
              prizeList: snapshot.docs[0].prizes,
              claimedprizes: snapshot.docs[0].claimedprizes
            });
            wx.hideToast();
          },
          onError: err => {
            console.log(err);
          }
        });
    } catch (err) {
      console.log(err);
    }
  },

  /**
   * 朋友圈分享
   */
  onShareTimeline() {
    logEvent("Share App");
    return {
      title: "积分兑现金好礼，尽在碳行家～",
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      query: `sharedFromID=${app.globalData.openID}&isFromShareTimeline=true`,
      success: function (res) {
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
      }
    };
  },

  onShareAppMessage() {
    logEvent("Share App");
    return {
      title: "快来一起低碳出街~",
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function (res) {
        console.log(res.shareTickets[0]);
      },
      fail: function (res) {
        console.log("share failed");
      }
    };
  }
});
