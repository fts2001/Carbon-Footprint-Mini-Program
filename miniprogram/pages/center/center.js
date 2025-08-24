// pages/center/center.ts
import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
import { initChart } from "../../utils/chart";
import { updateColor } from "../../utils/colorschema";
import { logEvent } from "../../utils/log";
import { onCheckSignIn, updateUserData } from "../../utils/login";
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isFromShareTimeline: true,
    isAutoLogin: false,
    credit: 0,
    carbSavings: 0,
    percent: 0,
    background: null,
    ec: {
      onInit: initChart
    },
    userInfo: null,
    openID: "",
    functionList: [
      {
        functionSrc: "../../asset/img/order_unread.png",
        functionTitle: "低碳问答",
        url: "../journal/journal?typeq=2"
      },
      {
        functionSrc: "../../asset/img/message_unread.png",
        functionTitle: "消息中心",
        url: "../notification/notification"
      },
      {
        functionSrc: "../../asset/img/credits.png",
        functionTitle: "积分好礼",
        url: "../prizeCenter/prizeCenter"
      }
    ],
    CoinRatio: 0
  },
  //用户注销
  delUser() {
    Dialog.confirm({
      title: "提示",
      message: "是否确认注销?"
    })
      .then(() => {
        const db = wx.cloud.database();

        db.collection("userInfo")
          .where({
            _openid: app.globalData.openID
          })
          .update({
            data: {
              delFlag: true
            }
          })
          .then(res => {
            console.log("更新成功:", res);
            app.globalData.userInfo = {};
            wx.clearStorageSync();
            wx.reLaunch({
              url: "/pages/index/index"
            });
          })
          .catch(err => {
            console.error("更新失败:", err);
          });
      })
      .catch(() => {
        // on cancel
      });
  },
  // updateCredit(){
  //   const db = wx.cloud.database()
  //   db.collection('lottery').where({
  //     _openid : this.data.openID
  //   }).watch({
  //     onChange:(snapshot) =>{
  //       console.log('query result snapshot after the event', snapshot.docs[0])
  //         this.setData({
  //           credit : snapshot.docs[0].credit,
  //           percent: Math.floor(snapshot.docs[0].credit/1.5)
  //         })
  //     },
  //     onError:(err)=>{
  //       console.log(err)
  //     }
  //   })
  // },
  updateCredit() {
    const info = getApp().globalData.userInfo;
    console.log("info of user", info);
    console.log("user Carb sum", info.carbSum);
    this.setData({
      carbSavings: info.carbSum.toFixed(3) // 保留三位小数
    });
  },

  editProfile() {
    onCheckSignIn({
      success: () => {
        // wx.showModal({
        //   title: '您确认要修改您的个人信息吗？',
        //   content: '点击确定按钮以重新编辑您的个人信息',
        //   success: (res) => {
        //     if(res.confirm) {
        //       wx.navigateTo({
        //         url:'/pages/login/login'
        //       })
        //     }
        //   }
        // })
      },
      failed: () => {
        wx.reLaunch({
          url: "/pages/index/index"
        });
      }
    });
  },

  toggleAutoLogin() {
    let localAutoLogin = wx.getStorageSync("autoLogin");
    if (localAutoLogin !== "") {
      wx.setStorageSync("autoLogin", !localAutoLogin);
      this.setData({
        isAutoLogin: !localAutoLogin
      });
    } else {
      wx.setStorageSync("autoLogin", true);
      this.setData({
        isAutoLogin: true
      });
    }
  },

  // initChart() {
  //   let chart;
  //   if (this.randerComponent) {
  //     this.randerComponent.init((canvas, width, height, dpr) => {
  //       const getPixelRatio = () => {
  //         let dpr = 0;
  //         wx.getSystemInfo({
  //           success: function (res) {
  //             dpr = res.pixelRatio
  //             console.log('dpr =  ', dpr)
  //           },
  //           fail: function () {
  //             dpr = 2
  //           }
  //         })
  //         return dpr
  //       }

  //       chart = echarts.init(canvas, null, {
  //         width: width,
  //         height: height,
  //         devicePixelRatio: getPixelRatio(),
  //       });
  //       setChartOption(chart);
  //       this.chart = chart;
  //       return chart
  //     })
  //   }
  // },

  onTapFunction(e) {
    onCheckSignIn({
      message: "使用此功能需登录",
      success: () => {
        console.log(e);
        console.log(e.currentTarget.dataset);
        let url = e.currentTarget.dataset.url;
        let title = e.currentTarget.dataset.title;
        if ((url != null) & (title != null)) {
          logEvent(title);
          wx.navigateTo({ url });
        }
      }
    });
  },

  /**
   * 处理touchmove事件
   */
  dealer() {
    return;
  },

  onSurvey(e) {
    logEvent("About Us");
    wx.navigateTo({
      url: "/pages/aboutus/aboutus"
    });
  },

  onPrivacy(e) {
    logEvent("Privacy Statement");
    wx.navigateTo({
      url: "/pages/privacy/privacy"
    });
  },

  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData() {
    if (!this.initData.executed) {
      this.updateCredit();
      // this.initChart();

      let localAutoLogin = wx.getStorageSync("autoLogin");
      if (localAutoLogin !== "") {
        this.setData({
          isAutoLogin: localAutoLogin
        });
      }

      this.initData.executed = true;
      console.log("center页面初始化成功！");
    } else {
      console.log("center页面已经初始化过了！");
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onReady() {},
  onLoad(options) {
    // 页面交互设置
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    });

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });

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
    } else {
      this.setData({
        isFromShareTimeline: false
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getTabBar();
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
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
        this.initData();
      }
    });

    // 更新页面
    this.randerComponent = this.selectComponent("#mychart-dom-area");
    wx.setNavigationBarTitle({
      title: "碳行家｜个人主页"
    });

    logEvent("Center Page");
  },

  /**
   * 朋友圈分享
   */
  onShareTimeline() {
    logEvent("Share App");
    return {
      title: "省碳领现金，快来试试吧～",
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    logEvent("Share App");
    return {
      title: "省碳得现金，就用碳行家~",
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
