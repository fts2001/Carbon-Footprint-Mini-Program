import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
import { setColorStyle, updateColor } from "../../utils/colorschema";
import { EventNames, eventTrack } from "../../utils/eventTrack";
import { logEvent } from "../../utils/log";
import { onHandleSignIn } from "../../utils/login";
// pages/index/index.ts
const app = getApp();

Page({
  /**
   * 页面常量
   */
  FIRST_PAGE: "information",

  /**
   * 页面实例数据
   */
  isFetchingUserInfo: false,
  isNavigating: false,

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    try {
      // 设置主题颜色
      setColorStyle("CYAN");

      // get user location and ip
      await wx.cloud.callFunction({
        name: "getUserip"
      });

      // Set user's openID
      const res = await wx.cloud.callFunction({ name: "login" });
      this.setData({ openID: (res.result as { data?: any }).data._openid });
      app.globalData.openID = (res.result as { data?: any }).data._openid;

      // share app message: Check if the sharedFromid is null, if the sender document does not exist, create it
      const sharedFromid = options.sharedFromID;
      console.log("sharedFromID", options.sharedFromID);
      if (!sharedFromid) {
        console.log("no share user");
      } else {
        try {
          wx.cloud.callFunction({
            name: "netCreate",
            data: {
              senderID: sharedFromid,
              receiverID: this.data.openID
            },
            success: function (res) {
              console.log(res);
            }
          });
        } catch (err) {
          console.log(err);
        }
      }

      // 文章分享跳转和自动登录
      if (options.isFromArticleShared) {
        wx.redirectTo({
          url: `/pages/detail/detail?sharedFromID=${sharedFromid}&link=${options.articleLink}&articleType=${options.articleType}`
        });
      } else {
        this.handleSignIn();
      }
    } catch (err) {
      console.log(err);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  // record share relations
  async recordShare(sharedFromid: string) {
    const db = wx.cloud.database();
    try {
      // Get the user's openid
      const res = await wx.cloud.callFunction({ name: "login" });
      const openid = (res.result as { data?: any }).data._openid;
      const createdAt = new Date();

      // Add the connection
      await db.collection("connections").add({
        data: {
          userA: sharedFromid,
          userB: openid,
          createdAt: createdAt
        }
      });

      return {
        success: true,
        message: "Share recorded successfully"
      };
    } catch (err) {
      console.error("Error recording share:", err);
      return {
        success: false,
        message: "Error recording share"
      };
    }
  },

  // 注册
  handleSignUp() {
    if (!this.isFetchingUserInfo && !this.isNavigating) {
      this.isFetchingUserInfo = true;
      this.onHandleSignUp();
    }
  },

  // 注册-抓取
  async onHandleSignUp() {
    const db = wx.cloud.database();

    try {
      const res = await wx.cloud.callFunction({ name: "login" });
      const openID = (res.result as { data?: any }).data._openid;
      this.setData({ openID });
      getApp().globalData.openID = openID;

      const userInfoQuery = await db.collection("userInfo").where({ _openid: openID }).get();

      if (userInfoQuery.data.length === 1) {
        getApp().globalData.userInfo = userInfoQuery.data[0];
        wx.showModal({
          title: "您已有账号",
          content: "请直接点击登录按钮登录",
          showCancel: false
        });
      } else {
        this.isNavigating = true;
        wx.redirectTo({
          url: "/pages/login/login",
          complete: () => (this.isNavigating = false)
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.isFetchingUserInfo = false;
    }
  },

  // 登录
  handleSignIn() {
    if (!this.isFetchingUserInfo && !this.isNavigating) {
      this.isFetchingUserInfo = true;
      onHandleSignIn({
        success: () => {
          console.log("1", app.globalData.userInfo);

          this.isNavigating = true;
          setTimeout(() => {
            // 如果用户注销过
            if (app.globalData.userInfo.delFlag == "1") {
              Dialog.alert({
                title: "提示",
                message: "您已注销, 无法登录!"
              }).then(() => {
                // on close
              });
            } else {
              wx.reLaunch({
                url: `/pages/${this.FIRST_PAGE}/${this.FIRST_PAGE}`,
                complete: () => (this.isNavigating = false)
              });
            }
          }, 500);
          this.isFetchingUserInfo = false;
        },
        failed: () => {
          // 如果没有账号，自动跳转到注册

          wx.showModal({
            title: "您尚未注册",
            content: "跳转到注册",
            showCancel: false
          });
          this.isFetchingUserInfo = false;
          this.handleSignUp();
        },
        error: () => {
          this.isFetchingUserInfo = false;
        }
      });
    }
  },

  // 游客登陆
  onVisitorEnter() {
    if (this.isFetchingUserInfo || this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    wx.showToast({
      title: "游客登录中",
      icon: "loading",
      mask: true,
      duration: 500
    });
    setTimeout(() => {
      wx.reLaunch({
        url: `/pages/${this.FIRST_PAGE}/${this.FIRST_PAGE}`,
        complete: () => (this.isNavigating = false)
      });
    }, 500);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("index page showing up");

    // 更新颜色
    updateColor();

    // [--- 埋点用户进入加载页面 ---]
    eventTrack.logEvent(EventNames.ENTER_LOADING_PAGE);
  },

  /**
   * 用户点击右上角分享
   */
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
