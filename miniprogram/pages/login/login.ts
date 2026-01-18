const { updateColor } = require("../../utils/colorschema");
const { onHandleSignIn } = require("../../utils/login");
const { logEvent } = require("../../utils/log");
const { transfer } = require("../../utils/transfer");
//import Dialog from "@vant/weapp/dialog/dialog";
import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
import { EventNames, eventTrack } from "../../utils/eventTrack";

const app = getApp();
const unknownAvatarUrl = "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
const defaultAvatarUrl = "cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/avatar/avatar.jpg";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    modalHidden: true,
    newUserModalShow: true,
    newUserModalShow2: false,
    userInfo: null,
    avatarUrl: unknownAvatarUrl,

    // code: null,
    // carSelected: false,
    // dobarr: ["18-29","30-49","50-65","65岁及以上"],
    // occupationArr: ["学生","事业单位工作人员","党政机关工作人员", "国有企业员工", "外资企业雇员", "民营企业雇员", "私企或个体经营户", "体力工人", "自由职业者", "商业，服务从业者","退休"],
    // gradArr: ["小学以下", "小学", "初中", "高中", "职高/中专", "大专", "大学", "硕士", "博士"],
    // transArr: ["步行或骑行","公共交通","驾驶机动车"],
    // carArr:["纯燃油车", "混合动力汽车", "插电式混合动力车", "增程式电动汽车","纯电动汽车"],
    // car:null,
    // occu: null,
    // grad: null,
    // trans:null,
    // dob: null,
    // email:'',
    nickname: null,
    // sex: [
    //   { name: '0', value: '男' },
    //   { name: '1', value: '女' },
    //   {name:'2', value:'保密'}
    // ],
    // choice: [
    //   { name: '0', value: '是', checked: 'true' },
    //   { name: '1', value: '否' }
    // ],
    // isSex: "",
    // userSex: ''

    // 登录改变后使用的属性
    sexArr: [
      //性别列表
      { name: "0", value: "男" },
      { name: "1", value: "女" },
      { name: "2", value: "保密" }
    ],
    sex: "",
    ageArr: ["18-29", "30-49", "50-65", "65岁及以上"],
    age: "",
    gradArr: ["高中及以下", "本科或专科", "研究生及以上(硕士或博士)"],
    grad: "",
    occupationArr: ["学生", "企业职工", "公务员", "事业单位人员", "自由职业者", "服务行业从业者", "农业或制造业", "其它"],
    occupation: "",
    incomeArr: ["不愿透露", "3,000元及以下", "3,001~5,000元", "5,001~12,000元", "12,001~30,000元", "30,001元及以上"],
    income: "",
    loginType: "", //登录类型,0/1分别代表的是华表版本和环境版本
    authorizeDialog: false, //提示权限的弹窗
    showPopup: false, //展示模拟授权消息订阅的弹窗
    messageAuthorize: false, //消息订阅权限
    scoreTipsDialog: false //积分说明弹窗
  },

  // 改变属性
  newChange(e) {
    console.log(e);
    let name = e.currentTarget.dataset.name;
    let value = e.detail.value;
    let data = this.data;
    data[name] = value;
    this.setData(data);
  },
  showScoreTips() {
    this.setData({ scoreTipsDialog: true });
  },
  // 1. 先随机一下登录类型
  getLoginType() {
    this.setData({ loginType: Math.random() < 0.5 ? 0 : 1 });
  },
  // 2. 再显示授权提示弹窗
  showAuthorizeDialog() {
    this.setData({ authorizeDialog: true });
  },
  // 3. 然后申请授权
  getAuthorize() {
    // 权限列表
    var scopes = [
      { scope: "scope.userLocation", content: "实时位置权限: 用于行程轨迹记录" },
      { scope: "scope.werun", content: "微信运动步数: 用于出行方式分析" }
    ];
    var promises: any = [];
    scopes.forEach(scope => {
      promises.push(this.authorize(scope));
    });
    Promise.all(promises).then(res => {
      // 筛选出用户同意的授权
      const authorizedScopes = res.filter(result => result.success).map(result => result.data.scope);

      // [--- 埋点用户给出的权限 ---]
      if (authorizedScopes.length > 0) {
        eventTrack.logEvent(EventNames.USER_AUTHORIZES, { authorizes: authorizedScopes });
      }

      // 前两个授权加载完成之后，还要模拟是否授权取消订阅
      this.simulateAuthorize();
    });
  },
  // 3_1. 申请授权的子接口
  authorize(data) {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          if (!res.authSetting[data.scope]) {
            wx.authorize({
              scope: data.scope,
              success: () => {
                resolve({ data: data, success: true });
              },
              fail: err => {
                resolve({ data: data, success: false });
              }
            });
          } else {
            resolve({ data: data, success: true });
          }
        }
      });
    });
  },
  // 4. 需要模拟授权消息订阅
  simulateAuthorize() {
    this.setData({ showPopup: true });
  },
  // 4_1. 模拟授权的配套方法, 关闭弹窗
  onClosePopup() {
    this.setData({ showPopup: false });
    this.finishLogin();
  },
  // 4_2. 模拟授权的配套方案, 确认授权
  submitSimulateAuthorize() {
    this.setData({ showPopup: false, messageAuthorize: true });
    this.finishLogin();
  },

  // 5. 改变后的登录接口
  async finishLogin() {
    this.setData({ nickname: "微信用户" });
    if (!this.validateForm() || app.globalData.userInfo) {
      return;
    }

    // Lock for only input once
    if (!this.finishLogin.lock) {
      this.finishLogin.lock = true;
    } else {
      return;
    }
    // data to be uploaded
    var basicInfo = {
      nickname: this.data.nickname,
      sex: this.data.sex,
      age: this.data.age,
      grad: this.data.grad,
      occupation: this.data.occupation,
      income: this.data.income,
      loginType: Math.random() < 0.5 ? 0 : 1,
      authorize: {
        userLocation: false,
        werun: false,
        messageAuthorize: this.data.messageAuthorize
      }
    };

    // [--- 埋点用户被分入了哪个组 ---]
    eventTrack.logEvent(EventNames.USER_LOGIN_TYPE, { loginType: basicInfo.loginType });

    await wx.getSetting().then(res => {
      basicInfo.authorize.userLocation = res.authSetting["scope.userLocation"] || false;
      basicInfo.authorize.werun = res.authSetting["scope.werun"] || false;
    });
    console.log("basicInfo---", basicInfo);

    const carbSum = 0;
    const testGroup = Math.floor(Math.random() * Object.keys(app.constData.TOTAL_TEST_GROUP_COUNT).length) + 1;
    let avatar = this.data.avatarUrl === unknownAvatarUrl ? defaultAvatarUrl : this.data.avatarUrl;

    // if user upload the avatar, then we need to first upload it to cloud db
    if (avatar != defaultAvatarUrl) {
      wx.cloud.uploadFile({
        cloudPath: `avatar/${new Date().getTime()}.jpeg`,
        filePath: avatar,
        success: res => {
          console.log(res);
          avatar = res.fileID;
          this.uploadData(avatar, basicInfo, carbSum, testGroup);
        },
        fail: err => {
          console.log(err);
          wx.showToast({
            title: "上传头像失败",
            icon: "none",
            duration: 2000,
            mask: true
          });
          return;
        }
      });
    } else {
      this.uploadData(avatar, basicInfo, carbSum, testGroup);
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl
    });
  },

  closeNewUserModal() {
    this.setData({
      newUserModalShow: false,
      modalHidden: false
    });

    // [--- 埋点用户关闭弹窗 ---]
    eventTrack.logEvent(EventNames.CLOSE_MODAL, { name: "新用户88广告弹窗" });

    // [--- 埋点用户进入知情通知的时间 ---]
    eventTrack.logEvent(EventNames.ENTER_NOTIFICATION);
  },

  async modalConfirm(e) {
    // [--- 埋点用户知情通知点击同意 ---]
    eventTrack.logEvent(EventNames.AGREE_NOTIFICATION);

    // [--- 埋点用户关闭弹窗 ---]
    eventTrack.logEvent(EventNames.CLOSE_MODAL, { name: "知情通知" });
    this.setData({ modalHidden: true });
    this.setData({ newUserModalShow2: true });

    const settingRes = await wx.getSetting();
    if (!settingRes.authSetting["scope.userLocationBackground"]) {
      await Dialog.confirm({ title: "提示", message: "请前往右上角菜单，进入”设置“->“位置信息”并选择“使用小程序时和离开后允许”" });
      await wx.openSetting();
    }

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


  },

  modalCancel() {
    // [--- 埋点用户知情通知点击拒绝/取消 ---]
    eventTrack.logEvent(EventNames.REJECT_NOTIFICATION);
    wx.navigateBack({
      delta: 1
    });
  },

  // 单选按钮发生变化
  // radioChange(e) {
  //   console.log(e.detail.value);
  //   var sexName = this.data.isSex
  //   this.setData({
  //     isSex: e.detail.value
  //   })
  // },

  // bindgradChange: function (e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     grad: e.detail.value
  //   })
  // },

  // bindcarChange: function (e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     car: e.detail.value
  //   })
  // },

  // bindtransChange: function (e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     trans: e.detail.value
  //   })
  //   if (e.detail.value==2) {
  //     this.setData({
  //       carSelected: true
  //     })
  //   }else{this.setData({
  //     carSelected: false
  //   })}
  // },

  // bindOccuChange: function (e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     occu: e.detail.value
  //   })
  // },

  // bindDobChange: function (e) {
  //   console.log(e.detail.value)
  //   this.setData({
  //     dob: e.detail.value
  //   })
  // },

  // bindemailchange: function(e){
  //   console.log(e.detail.value)
  //   this.setData({
  //     email:e.detail.value
  //   })
  // },

  bindnamechange: function (e) {
    console.log(e.detail.value);
    this.setData({
      nickname: e.detail.value
    });
  },

  validateForm() {
    // const { nickname, dob, occu, grad, trans, car } = this.data
    const { nickname } = this.data;

    if (!nickname) {
      wx.showToast({
        title: "请输入昵称",
        icon: "none"
      });
      return false;
    }

    // if (!dob) {
    //   wx.showToast({
    //     title: '请选择年龄段',
    //     icon: 'none'
    //   })
    //   return false
    // }

    // if(!code){
    //   wx.showModal({
    //     title:'请授权手机号',
    //     content:'您的手机号将被加密储存，用于发放奖品' ,
    //     showCancel:false
    //   })
    // }

    // if (!occu) {
    //   wx.showToast({
    //     title: '请选择职业',
    //     icon: 'none'
    //   })
    //   return false
    // }

    // if (!grad) {
    //   wx.showToast({
    //     title: '请选择学历',
    //     icon: 'none'
    //   })
    //   return false
    // }

    // if (!trans) {
    //   wx.showToast({
    //     title: '请选择交通方式',
    //     icon: 'none'
    //   })
    //   return false
    // }
    // if (trans==2 && !car) {
    //   wx.showToast({
    //     title: '请选择汽车类型',
    //     icon: 'none'
    //   })
    //   return false
    // }
    return true;
  },

  login(e: any) {
    if (!this.validateForm() || app.globalData.userInfo) {
      return;
    }

    // Lock for only input once
    if (!this.login.lock) {
      this.login.lock = true;
    } else {
      return;
    }

    // data to be uploaded
    const basicInfo = e.detail.value;
    console.log(basicInfo);
    const carbSum = 0;
    const testGroup = Math.floor(Math.random() * Object.keys(app.constData.TOTAL_TEST_GROUP_COUNT).length) + 1;
    let avatar = this.data.avatarUrl === unknownAvatarUrl ? defaultAvatarUrl : this.data.avatarUrl;

    // if user upload the avatar, then we need to first upload it to cloud db
    if (avatar != defaultAvatarUrl) {
      wx.cloud.uploadFile({
        cloudPath: `avatar/${new Date().getTime()}.jpeg`,
        filePath: avatar,
        success: res => {
          console.log(res);
          avatar = res.fileID;
          this.uploadData(avatar, basicInfo, carbSum, testGroup);
        },
        fail: err => {
          console.log(err);
          wx.showToast({
            title: "上传头像失败",
            icon: "none",
            duration: 2000,
            mask: true
          });
          return;
        }
      });
    } else {
      this.uploadData(avatar, basicInfo, carbSum, testGroup);
    }

    // [--- 埋点新用户提交注册表单 ---]
    eventTrack.logEvent(EventNames.USER_LOGIN_FINISH);
  },

  uploadData: function (avatar: any, basicInfo: any, carbSum: any, testGroup: any) {
    wx.showToast({
      title: "正在登录",
      icon: "loading",
      duration: 100000000
    });
    wx.cloud.callFunction({
      name: "submituserinfo",
      data: {
        avatar,
        basicInfo,
        carbSum,
        testGroup
      },
      success: res => {
        console.log(res);

        const userInfo = {
          avatar: avatar,
          loginDate: new Date(),
          basicInfo: basicInfo,
          carbSum: carbSum,
          testGroup: testGroup
        };

        // set globalData
        app.globalData.userInfo = userInfo;

        if (res.result && typeof res.result === "object" && "success" in res.result) {
          if (res.result.success) {
            // 注册成功，显示提示
            wx.hideToast();
            wx.showToast({
              title: '注册成功！',
              icon: 'success',
              duration: 2000
            });

            // 注册成功后跳转到信息页面
            setTimeout(() => {
              wx.reLaunch({
                url: "/pages/information/information"
              });
            }, 2000);
          }
        }
      }
    });
  },

  //  async transferEntranceMoney({ complete }: { complete?: () => void }) {
  //    if (!this.transferEntranceMoney.lock) {
  //      this.transferEntranceMoney.lock = true;

  //      // transfer entrance money
  //      const db = wx.cloud.database();
  //      const transferMoney = (await db.collection("transferMoney").get()).data[0];

  //      const _openid = app.globalData.openID;
  //      const active = transferMoney.active;
  //      const money = transferMoney.entrance.money;
  //      const remark = transferMoney.entrance.info;

  //      // 启用
  //      if (active) {
  //        await transfer({
  //          money,
  //          remark,
  //          _openid,

  //          // 发放成功回调
  //         success: (result: any) => {
  //           console.log("Transfer successful:", result);
  //           wx.hideToast();
  //           wx.showModal({
  //             title: "注册成功",
  //             content: "低碳现金红包已发放", //
  //             showCancel: false,
  //             success: () => {
  //               if (complete) complete();
  //             }
  //           });
  //         },
  //         failed: (error: { message: any; }) => {
  //           console.log("Transfer failed:", error);
  //           wx.hideToast();
  //           wx.showModal({
  //             title: "出问题了",
  //             content: error.message,
  //             showCancel: false,
  //             success: () => {
  //               if (complete) complete();
  //             }
  //           });
  //         },
  //         error: (err: { message: any; }) => {
  //           console.log("Error during transfer:", err);
  //           wx.hideToast();
  //           wx.showModal({
  //             title: "出问题了",
  //             content: err.message,
  //             showCancel: false,
  //             success: () => {
  //               if (complete) complete();
  //             }
  //           });
  //         }
  //       });

  //       // 未启用
  //     } else {
  //       wx.hideToast();
  //       wx.showModal({
  //         title: "抱歉",
  //         content: "现金奖励未启用",
  //         showCancel: false,
  //         success: () => {
  //           if (complete) complete();
  //         }
  //       });
  //     }

  //     this.transferEntranceMoney.lock = false;
  //   } else {
  //     if (complete) complete();
  //   }
  // },

  onLoad() {
    // 更新颜色
    updateColor();
  },

  onShow() {
    // [--- 埋点用户进入注册问卷的时间 ---]
    eventTrack.logEvent(EventNames.NEW_USER_SIGN_UP);

    // [--- 埋点新用户88弹窗 ---]
    eventTrack.logEvent(EventNames.NEW_USER_88_MODAL);
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
  },
  accept() {
    this.setData({ newUserModalShow2: false });

    // [--- 埋点用户关闭弹窗 ---]
    eventTrack.logEvent(EventNames.CLOSE_MODAL, { name: "新用户省碳足迹赢现金弹窗" });

    // 发放注册奖励
    this.sendNewUserReward();
  },

  // 发放新用户注册奖励
  async sendNewUserReward() {
    console.log('[发红包] 开始创建红包ticket', {
      type: 1,
      money: 30,
      timestamp: new Date().toISOString()
    });

    wx.showLoading({
      title: '正在生成红包...',
      mask: true
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'sendCashReward',
        data: {
          type: 1,  // 1代表新用户注册奖励
          money: 30  // 注册奖励金额（单位：分）
        }
      });

      console.log('[发红包] 云函数返回结果:', res);

      wx.hideLoading();

      if (res.result && res.result.success && res.result.ticket) {
        const ticket = res.result.ticket;
        const domain = res.result.domain || 'mp001.yaoyaola.net'; // 使用动态域名，如果没有则使用默认值

        console.log('[发红包] Ticket创建成功', {
          ticket: ticket,
          domain: domain,
          timestamp: new Date().toISOString()
        });

        // 显示提示
        wx.showToast({
          title: '红包已生成',
          icon: 'success',
          duration: 1500
        });

        // 延迟后跳转到红包领取页面
        setTimeout(() => {
          const redPacketUrl = `https://${domain}/exapi/gethb/10815051?ticket=${ticket}`;
          console.log('[发红包] 跳转到红包领取页面:', redPacketUrl);

          wx.navigateTo({
            url: `/pages/redpacket/redpacket?url=${encodeURIComponent(redPacketUrl)}`,
            fail: (err) => {
              console.error('[发红包] 跳转失败，使用备用方案:', err);
              // 备用方案：直接用web-view组件
              wx.showModal({
                title: '提示',
                content: '请稍后在"我的奖励"页面查看红包',
                showCancel: false
              });
            }
          });
        }, 1500);
      } else {
        console.error('[发红包] Ticket创建失败', {
          result: res.result,
          timestamp: new Date().toISOString()
        });

        // 创建失败，但不阻止用户继续使用
        wx.showToast({
          title: '红包生成失败，请联系客服',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('[发红包] 调用异常:', err, {
        timestamp: new Date().toISOString(),
        errorDetails: JSON.stringify(err)
      });

      wx.hideLoading();

      // 发生错误，但不阻止用户继续使用
      wx.showToast({
        title: '网络错误，稍后请联系客服领取奖励',
        icon: 'none',
        duration: 2000
      });
    }
  }
});
