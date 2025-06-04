import Dialog from "@vant/weapp/dialog/dialog";
import { updateColor } from "../../utils/colorschema";
import { getLocation, getNowTime } from "../../utils/home.util";
import { logEvent } from "../../utils/log";
import { onCheckSignIn, updateUserData } from "../../utils/login";
import { getWeekRange } from "../../utils/time";
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
    const settingRes = await wx.getSetting();
    if (!settingRes.authSetting["scope.userLocationBackground"]) {
      await Dialog.confirm({ title: "提示", message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”" });
      await wx.openSetting();
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
  // 刷新今日最新出行记录
  async refreshLastTrack() {
    // 今日出行记录
    const {
      result: { showPoint, isRecordEmpty, list }
    } = (await wx.cloud.callFunction({ name: "getLastTrack", data: { showAll: true } })) || {};

    getApp().globalData.showPoint = showPoint;
    // 行程百分比分析
    const { result: showSchedules } = (await wx.cloud.callFunction({ name: "getTrackRange", data: { list } })) || {};
    this.setData({ showPoint, showSchedules, todayRecordList: list.reverse(), isRecordEmpty });
    this.getTabBar().setData({ showPoint });
    return list;
  },
  // Start recording 记录值
  startTracking: function () {
    let cnt = 10;
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

    // 该方法不支持Promise，仅支持回调
    wx.getWeRunData({
      complete: async res => {
        this.setData({ isTracking: false, updating: true });
        const { result: resp = null } = (await wx.cloud.callFunction({ name: "echo", data: { info: wx.cloud.CloudID(res.cloudID) } })) || {};
        const stepList = resp.info.data ? resp.info.data.stepInfoList : null;

        const { latitude, longitude } = await getLocation();
        const {
          result: { carbSum, trackRes, speeds }
        } =
          (await wx.cloud.callFunction({
            name: "endTrack",
            data: {
              stepList,
              latitude,
              longitude,
              curID: _this.data.curID,
              purpose: _this.data.purpose,
              transport: _this.data.transport
            }
          })) || {};

        try {
          const {
            data: { prediction }
          } = await wx.cloud.callContainer({
            config: {
              env: "prod-5g9hyw5ua680d3fc"
            },
            path: "/predict",
            header: {
              "X-WX-SERVICE": "trip",
              "X-WX-EXCLUDE-CREDENTIALS": "unionid, cloudbase-access-token, openid"
            },
            method: "POST",
            data: { speeds }
          });

          await wx.cloud.callFunction({
            name: "updateTrackTransport",
            data: { curID: _this.data.curID, prediction }
          });
        } catch (e) {
          console.error("Caught error:", e);
        } finally {
          setTimeout(() => {
            _this.setData({ updating: false });
          }, 500);
        }

        if (trackRes.stats.updated == 1) {
          console.log("行程记录成功！", trackRes);
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
  /**
   * 初始化本页面数据，此函数使用闭包，多次调用只会初始化一次
   */
  initData() {
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
    this.checkSetting();

    // 渲染今日最新数据
    const track = await this.refreshLastTrack();

    const userInfoRes = await db.collection("userInfo").limit(1).where({ _openid: app.globalData.openID }).get();
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
  finishAndEndTrack() {
    const transportFinish = this.data.transport.length;
    const purposeFinish = this.data.purpose.length;

    if (!transportFinish) return this.setData({ show: true });
    if (!purposeFinish) return this.setData({ showPurposes: true });
    const finish = transportFinish && purposeFinish;

    finish && this.endTrack();
  },
  onConfirmTransport() {
    if (!this.data.transport.length) return wx.showToast({ icon: "none", title: "请选择出行方式" });
    this.setData({ show: false });
    this.finishAndEndTrack();
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
  }
});
