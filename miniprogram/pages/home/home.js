import Dialog from "@vant/weapp/dialog/dialog";
import { updateColor } from "../../utils/colorschema";
import { getLocation, getNowTime, isGreaterOrEqualMinutes, probability } from "../../utils/home.util";
import { logEvent } from "../../utils/log";
import { onCheckSignIn, updateUserData } from "../../utils/login";
import { createCountdownTimer, getWeekRange } from "../../utils/time";
import data from "./data";

const app = getApp();
const db = wx.cloud.database();

Page({
  data,
  setWeather() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: "gcj02",
        success: loc => {
          const latitude = loc.latitude.toFixed(2);
          const longitude = loc.longitude.toFixed(2);
          console.log("Location:", longitude, latitude);

          wx.cloud.callFunction({
            name: "setweather",
            data: { latitude, longitude },
            success: res => {
              const { cityName, aqi, category, weather } = res.result;
              this.setData({
                name: cityName,
                aqi,
                category,
                weather,
                latitude,
                longitude
              });
              resolve({
                openid: app.globalData.openID,
                cityName,
                latitude,
                longitude,
                weather
              });
            },
            fail: err => {
              console.error("Error calling cloud function:", err);
              reject(err);
            }
          });
        },
        fail: err => {
          console.error("Error getting location:", err);
          reject(err);
        }
      });
    });
  },
  // 记录前隐私调用准备 弹窗
  async checkSetting(autoStart) {
    var that = this;
    const settingRes = await wx.getSetting();
    if (!settingRes.authSetting["scope.userLocationBackground"]) {
      // await Dialog.confirm({ title: "提示", message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”" });
      // await wx.openSetting();
      Dialog.confirm({
        title: "提示",
        message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”",
        confirmButtonText: "前往授权",
        cancelButtonText: "直接开始"
      })
        .then(() => {
          wx.openSetting();
        })
        .catch(() => {
          that.showTip(autoStart);
        });
    } else {
      autoStart && this.onTrack();
      wx.getLocation({
        type: "gcj02",
        success: async loc => {
          const latitude = loc.latitude.toFixed(2);
          const longitude = loc.longitude.toFixed(2);

          const { result: sendParams } = (await wx.cloud.callFunction({ name: "setweather", data: { longitude, latitude } })) || {};
          wx.cloud.callFunction({
            name: "addLocation",
            data: { sendParams },
            fail: err => console.log("error==", err)
          });
        }
      });
    }
  },
  showTip(autoStart) {
    console.log(autoStart);
    var that = this;
    setTimeout(() => {
      Dialog.alert({
        title: "提示",
        message: "因未授权实时位置或微信步数， 无法自动计算路程，结束行程后需手动输入"
      }).then(() => {
        console.log(autoStart);
        autoStart && that.onTrack();
      });
    }, 1000);
  },
  // 刷新今日最新出行记录
  async refreshLastTrack() {
    // 今日出行记录
    const {
      result: { showPoint, isRecordEmpty, list }
    } = (await wx.cloud.callFunction({ name: "getLastTrack", data: { showAll: true } })) || {};

    console.log(list, 111);

    getApp().globalData.showPoint = showPoint;
    // 行程百分比分析
    const { result: showSchedules } = (await wx.cloud.callFunction({ name: "getTrackRange", data: { list } })) || {};
    this.setData({ showPoint, showSchedules, todayRecordList: list.reverse(), isRecordEmpty });
    this.getTabBar().setData({ showPoint });
    return list;
  },
  // Start recording 记录值
  startTracking: async function () {
    let cnt = 10;
    // 权限未开就不用这个了, 会弹出授权弹窗
    const settingRes = await wx.getSetting();
    if (settingRes.authSetting["scope.userLocationBackground"]) {
      wx.startLocationUpdateBackground({
        success: res => console.log("开启后台定位", res),
        fail: err => console.error("开启后台定位失败", err)
      });
      wx.onLocationChange(async locationFn => {
        cnt++;
        // 此处可调节记录区间 单位->秒
        if (cnt >= 10) {
          cnt = 0;
          await wx.cloud.callFunction({
            name: "updateTrack",
            data: {
              curID: this.data.curID,
              recordItem: { timestamps: new Date(), velos: locationFn.speed, points: new db.Geo.Point(locationFn.longitude, locationFn.latitude) }
            }
          });
        }
      });
    }
  },
  onClickEvent() {
    if (this.data.updating) return wx.showToast({ title: "正在更新中，请勿重复操作!", icon: "none", duration: 2000 });

    if (this.data.userInfo != null) {
      if (!this.data.recordStatus) {
        this.setData({ startNowTime: getNowTime() });
        this.checkSetting(true);
      } else {
        wx.showModal({
          title: "提示",
          content: "要结束本次行程记录吗？",
          success: res => {
            if (!res.confirm) return;
            this.finishAndEndTrack();
          }
        });
      }
    }
    onCheckSignIn({ message: "请先注册/登录并同意隐私条款" });
  },
  // Start recording
  onTrack() {
    this.setData({
      btnClass: "btn btn-start",
      recordStatus: true,
      isTracking: true,
      startTime: +new Date(),
      myTimer: setInterval(() => {
        this.setData({ duration: +new Date() - this.data.startTime });
      }, 1000)
    });

    wx.getWeRunData({
      complete: async res => {
        wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } });

        const { result = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = result.info.data ? result.info.data.stepInfoList : null;

        // 初始化当前的track记录
        const { result: trackId } =
          (await wx.cloud.callFunction({
            name: "createTrack",
            data: {
              brand: this.data.brand,
              model: this.data.model,
              system: this.data.system,
              version: this.data.version,
              platform: this.data.platform,
              capacity: this.data.capacity,
              startSteps: stepList ? stepList[30].step : null,
              transport: this.data.transportList[this.data.index]
            }
          })) || {};

        this.setData({ curID: trackId });
        // 开始记录值
        this.startTracking();
      }
    });
  },
  // End recording
  endTrack() {
    const _this = this;
    if (this.data.isManual && !this.data.dist) {
      wx.showToast({
        title: "请输入出行距离",
        icon: "none"
      });
      return;
    }
    if (this.data.isManual && this.data.transport.length < 1) {
      wx.showToast({
        title: "请选择出行方式",
        icon: "none"
      });
      return;
    }
    if (this.data.isManual && this.data.purpose.length < 1) {
      wx.showToast({
        title: "请选择出行目的地",
        icon: "none"
      });
      return;
    }
    this.setData({ showManualDialog: false });
    wx.showLoading({
      title: "记录中...",
      mask: true
    });
    // 该方法不支持Promise，仅支持回调
    wx.getWeRunData({
      complete: async res => {
        this.setData({ isTracking: false, updating: true });
        const { result: resp = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = resp.info.data ? resp.info.data.stepInfoList : null;

        const { latitude, longitude } = this.data.isManual ? { latitude: 0, longitude: 0 } : await getLocation();
        const {
          result: { carbSum, trackRes, speeds }
        } =
          (await wx.cloud.callFunction({
            name: this.data.isManual ? "endTrackManual" : "endTrack",
            data: {
              dist: this.data.dist,
              stepList,
              latitude,
              longitude,
              curID: _this.data.curID,
              purpose: _this.data.purpose,
              transport: _this.data.transport
            }
          })) || {};

        console.log("trackRes---", trackRes);
        try {
          // const {
          //   data: { prediction }
          // } = await wx.cloud.callContainer({
          //   config: {
          //     env: "prod-5g9hyw5ua680d3fc"
          //   },
          //   path: "/predict",
          //   header: {
          //     "X-WX-SERVICE": "trip",
          //     "X-WX-EXCLUDE-CREDENTIALS": "unionid, cloudbase-access-token, openid"
          //   },
          //   method: "POST",
          //   data: { speeds }
          // });
          // await wx.cloud.callFunction({
          //   name: "updateTrackTransport",
          //   data: { curID: _this.data.curID, prediction }
          // });
        } catch (e) {
          console.error("Caught error:", e);
        } finally {
          setTimeout(() => {
            _this.setData({ updating: false });
          }, 500);
        }
        wx.hideLoading();
        if (trackRes.stats.updated == 1) {
          console.log("行程记录成功！", trackRes);

          // 大于等于3分钟、距离大于3KM 、生碳值待定
          const minKM = 3;
          const minMinute = 3;
          const minCarbSum = 0;
          const maxCredit = 50;
          if (carbSum >= minCarbSum && Number(this.data.dist || 0) > minKM && isGreaterOrEqualMinutes(this.data.startTime, +new Date(), minMinute)) {
            // 判断概率 1/2
            if (probability(2)) {
              // 判断是否当日已经超额
              const { data } = wx.cloud.callFunction({ name: "getDailyCredit", data: { type: 1 } });
              const { totalCredit } = data?.result || {};
              if (Number(totalCredit) < maxCredit) {
                await wx.cloud.callFunction({
                  name: "setDailyCredit",
                  data: { type: 1, credit: 10 }
                });
                wx.cloud.callFunction({
                  name: "updateUserInfo",
                  data: { credit: 10 }
                });
                this.setData({ scoreModalShow: true });
              }
            }
          }

          // 判断是否是第一次记录, 第一次需要展示接口问卷
          this.ifShowExportQuestion();
          wx.showToast({ title: "行程记录成功!", icon: "success", duration: 2000 });
          clearInterval(_this.data.myTimer);

          _this.setData({
            startTime: 0,
            endTime: 0,
            duration: 0,
            capacity: 0,
            index: _this.data.defaultIndex,
            btnClass: "btn btn-default",
            recordStatus: false
          });
          wx.stopLocationUpdate();
          wx.offLocationChange();

          // 重载数据
          _this.refreshLastTrack();
          _this.onTransportModalClose();
          _this.onPurposeModalClose();

          wx.cloud.callFunction({
            name: "updateUserInfo",
            data: {
              carbon: carbSum,
              credit: 25 // default increment
            }
          });
        }
      }
    });
  },
  // 判断是否是第一次记录行程, 第一次需要展示出口问卷
  ifShowExportQuestion() {
    const db = wx.cloud.database();
    db.collection("track")
      .where({
        _openid: app.globalData.openID
      })
      .count()
      .then(res => {
        console.log("已进行的行程记录数量：", res.total);
        if (res.total <= 1) {
          // 打开问卷弹窗
          this.setData({
            showExportDialog: true,
            exportQuestion: this.data.exportQuestion.map(q => {
              if (q.showFlag == "location_1") {
                q.show = !this.data.isManual;
              } else if (q.showFlag == "location_0") {
                q.show = this.data.isManual;
              } else {
                q.show = true;
              }
              return q;
            })
          });
        }
      })
      .catch(err => {
        console.error("查询失败：", err);
      });
  },
  // 出口问卷改变radio
  newChange(e) {
    var i = e.currentTarget.dataset.i;
    var exportQuestion = this.data.exportQuestion;
    var value = e.detail.value;
    if (value == "other") {
      wx.showModal({
        title: "请输入其它原因",
        editable: true,
        complete: res => {
          if (res.confirm) {
            exportQuestion[i].reply = res.content;
            exportQuestion[i].showOtherReply = true;
            this.setData({ exportQuestion });
          }
        }
      });
    } else {
      exportQuestion[i].reply = value;
      exportQuestion[i].showOtherReply = false;
      this.setData({ exportQuestion });
    }
  },
  // 保存出口问卷
  saveExportQuestion() {
    var that = this;
    var exportQuestion = this.data.exportQuestion
      .filter(q => q.show)
      .map(q => {
        delete q.showFlag;
        delete q.show;
        delete q.answer;
        delete q.otherAnswer;
        delete q.showOtherReply;
        return q;
      });

    const db = wx.cloud.database();
    db.collection("exportQuestions").add({
      data: {
        questions: exportQuestion
      },
      success: function (res) {
        that.setData({ showExportDialog: false });
        // 前往奖品页面
        wx.navigateTo({
          url: "/pages/pointsPrize/pointsPrize"
        });
      },
      fail: function (err) {
        console.log(err);
      }
    });
  },
  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData() {
    // wx.navigateTo({
    //   url: '/pages/pointsPrize/pointsPrize',
    // })
    if (!this.initData.executed) {
      this.reloadData();
      this.initData.executed = true;
      console.log("home页面初始化成功！");
    } else {
      console.log("home页面已经初始化过了！");
    }
  },

  async reloadData() {
    // 系统信息
    const res = await wx.getSystemInfo();
    this.setData({ brand: res.brand, model: res.model, system: res.system, version: res.version, platform: res.platform });

    // 检查用户是否禁用后台设置
    // this.checkSetting();

    // 渲染今日最新数据
    const track = await this.refreshLastTrack();

    const userInfoRes = await db.collection("userInfo").limit(1).where({ _openid: app.globalData.openID }).get();
    const { data = [] } = userInfoRes || {};
    const [userInfo] = data || [];

    if (userInfo?.firstStatus) {
      this.showPrizeModal();
    } else {
      this.showActivityModal();
    }

    const [{ _id, endTime }] = Array.isArray(track) ? (track.length ? track : [{}]) : [{}];
    console.log(endTime);

    this.setData({
      curID: _id,
      index: userInfoRes.data[0].basicInfo.trans,
      defaultIndex: userInfoRes.data[0].basicInfo.trans
    });
  },

  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (!options.isFromShareTimeline) return this.setData({ isFromShareTimeline: false });

    wx.redirectTo({
      url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
      success: () => this.setData({ isFromShareTimeline: false })
    });
  },
  onShow() {
    this.getTabBar();
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 朋友圈进来则不显示
    if (this.data.isFromShareTimeline) return;

    // 更新颜色
    updateColor();
    // 检查登录状态
    updateUserData();
    logEvent("Home Page");
    this.updateWeeklyRanking();
    wx.setNavigationBarTitle({ title: "碳行家｜行程记录" });
    onCheckSignIn({ message: "请您登录", success: () => this.initData() });
    this.setWeather();
  },

  // Function to update the weekly ranking
  async updateWeeklyRanking() {
    const { firstDayOfWeek } = getWeekRange();
    try {
      const result = await wx.cloud.callFunction({
        name: "updateweeklyranking",
        data: { firstDayOfWeek }
      });

      const rankedUsers = result.result.rankedUsers;

      this.setData({ users: rankedUsers });
      const currentUser = rankedUsers.find(user => user._openid === app.globalData.openID);
      if (currentUser) {
        this.setData({ mysaving: currentUser.totalCarbSum, myranking: currentUser.rank });
      } else {
        this.setData({ mysaving: "<1", myranking: "未上榜" });
      }
      return rankedUsers;
    } catch (error) {
      console.error("Error updating weekly ranking:", error);
    }
  },
  // below are dedicated for sharing
  shareCommon() {
    return {
      title: "我本周已省碳" + this.data.mysaving + "kg，你也来试试吧！",
      imageUrl:
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313"
    };
  },
  onShareTimeline() {
    logEvent("Share App");
    return {
      ...this.shareCommon(),
      query: `sharedFromID=${app.globalData.openID}&isFromShareTimeline=true`
    };
  },
  onShareAppMessage() {
    logEvent("Share App");
    return {
      ...this.shareCommon(),
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}`
    };
  },
  //  functions for new UI starts here
  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
    if (event.currentTarget.dataset.tab == "rank") {
      Dialog.alert({
        title: "提示",
        message: "该功能正在维护中"
      }).then(() => {
        // on close
      });
    }
  },
  onClickTransportation(e) {
    const arr = this.data.transport;
    const index = arr.indexOf(e.currentTarget.dataset.tp);
    if (index !== -1) {
      arr.splice(index, 1);
    } else {
      arr.push(e.currentTarget.dataset.tp);
    }
    this.setData({ transport: arr });
  },
  onClickPurpose(e) {
    const arr = this.data.purpose;
    const index = arr.indexOf(e.currentTarget.dataset.purpose);
    if (index !== -1) {
      arr.splice(index, 1);
    } else {
      arr.push(e.currentTarget.dataset.purpose);
    }
    this.setData({ purpose: arr });
  },
  onTransportModalClose() {
    this.setData({ show: false, transport: [] });
  },
  onPurposeModalClose() {
    this.setData({ showPurposes: false, purpose: [] });
  },
  onManualModalClose() {
    this.setData({ showManualDialog: false });
  },
  onQuestionModalClose() {
    this.setData({ showExportDialog: false });
  },
  async finishAndEndTrack() {
    const settingRes = await wx.getSetting();
    console.log(settingRes);
    if (!settingRes.authSetting["scope.userLocationBackground"]) {
      // 查询权限是否正常, 如不正常, 需要手动输入出行距离
      this.setData({ isManual: true, showManualDialog: true });
    } else {
      // 权限正常, 则正常使用
      const transportFinish = this.data.transport.length;
      const purposeFinish = this.data.purpose.length;

      if (!transportFinish) return this.setData({ show: true });
      if (!purposeFinish) return this.setData({ showPurposes: true });
      const finish = transportFinish && purposeFinish;

      finish && this.endTrack();
    }
  },
  onConfirmTransport() {
    if (!this.data.transport.length) return wx.showToast({ icon: "none", title: "请选择出行方式" });
    this.setData({ show: false });
    this.finishAndEndTrack();
  },
  chooseTransport() {
    this.setData({ show: true, showManualDialog: false });
  },
  choosePurpose() {
    this.setData({ showPurposes: true, showManualDialog: false });
  },
  inputChange(e) {
    this.setData({ dist: e.detail.value });
  },
  onConfirmPurpose() {
    if (!this.data.purpose.length) return wx.showToast({ icon: "none", title: "请选择出行方式" });
    this.setData({ showPurposes: false });
    this.finishAndEndTrack();
  },
  onClickTrackCard(e) {
    const { currentTarget } = e || {};
    const { dataset } = currentTarget || {};
    const { item: currentItem } = dataset || {};
    if ((Array.isArray(currentItem?.purpose) && !!currentItem?.purpose?.length) || (!Array.isArray(currentItem?.purpose) && currentItem?.purpose))
      return;

    this.setData({ curID: currentItem._id });
    this.finishAndEndTrack();
  },
  showPrizeModal() {
    this.setData({ prizeModalShow: true });
  },
  async confirmPrize() {
    this.setData({ prizeModalShow: false });
    // 调用云函数发钱
    wx.cloud.callFunction({
      name: "sendCashReward",
      data: {
        u_openid: app.globalData.openID,
        type: "0",
        money: String(50) // 0.5
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showModal({
            title: "恭喜！",
            content: "首次注册获得0.5注册金",
            showCancel: false
          });
          this.setData({
            rotateDeg: 0,
            rotateStyle: "transform: rotate(0deg);"
          });
        } else {
          wx.showToast({
            title: "发放失败，请稍后再试",
            icon: "error",
            duration: 1500
          });
        }
      },
      fail: err => {
        console.error("云函数调用失败:", err);
        wx.showToast({
          title: "请求失败",
          icon: "error",
          duration: 1500
        });
      }
    });

    await wx.cloud.callFunction({
      name: "updateUserInfo",
      data: { firstStatus: false }
    });
  },
  showActivityModal() {
    const countdown = createCountdownTimer(this.data.userInfo?.loginDate);
    const { expired, days, hours, minutes } = countdown();
    if (!expired) {
      this.setData({ showTimer: `${days}天${hours}时${minutes}分` });
      this.setData({ activityModalShow: true });
    } else {
      this.setData({ showTimer: "已过期" });
      this.setData({ activityModalShow: false });
    }
  },
  closeActivityModal() {
    this.setData({ activityModalShow: false });
  },
  closeScoreModal() {
    this.setData({ scoreModalShow: false });
  }
});
