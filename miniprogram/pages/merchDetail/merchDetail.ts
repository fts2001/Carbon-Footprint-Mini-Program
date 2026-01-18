import { updateColor } from '../../utils/colorschema'
import { logEvent } from "../../utils/log";
const app = getApp();

Page({
  data: {
    background: null,
    code: null,
    flag: false,
    merch: {
      merch_id: '',
      image: '',
      title: '',
      description: '',
      longDescription: '',
      price: 0
    }
  },
  onLoad(options) {
    const merchId = options.merch_id;
    this.getMerchDetail(merchId);

  },
  getMerchDetail(merchId) {
    const prizes = wx.getStorageSync('prizes');
    const merch = prizes.find(item => item.merch_id == merchId);
    if (merch) {
      this.setData({ merch });
    }
  },

  async claimMerch() {
    const merchType = this.data.merch.type;

    // 现金兑换：不需要手机号
    if (merchType === '现金') {
      this.exchangeCash();
    }
    // 实物兑换：需要手机号
    else {
      this.exchangePhysical();
    }
  },

  // 现金兑换
  async exchangeCash() {
    const app = getApp();
    const openid = app.globalData.openID;
    const { price, merch_id, title, cash_amount } = this.data.merch;

    console.log('[现金兑换] 开始', { price, merch_id, title, cash_amount });

    wx.showModal({
      title: '请您确认',
      content: `以 ${price} 积分兑换 ${title}?`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在兑换...', mask: true });

          try {
            const result = await wx.cloud.callFunction({
              name: 'exchangeCash',
              data: {
                openid,
                merch_id,
                price,
                cash_amount,
                title
              }
            });

            wx.hideLoading();
            console.log('[现金兑换] 云函数返回:', result);

            if (result.result.success && result.result.ticket) {
              const { ticket, domain } = result.result;
              const url = `https://${domain}/exapi/gethb/10815051?ticket=${ticket}`;

              console.log('[现金兑换] 成功，跳转到红包页面');

              wx.showToast({
                title: '红包已生成',
                icon: 'success',
                duration: 1500
              });

              setTimeout(() => {
                wx.navigateTo({
                  url: `/pages/redpacket/redpacket?url=${encodeURIComponent(url)}`,
                  fail: (err) => {
                    console.error('[现金兑换] 跳转失败:', err);
                    wx.showModal({
                      title: '提示',
                      content: '请稍后在我的奖励页面查看红包',
                      showCancel: false
                    });
                  }
                });
              }, 1500);
            } else {
              wx.showToast({
                title: result.result.error || '兑换失败，请稍后再试',
                icon: 'none',
                duration: 2000
              });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('[现金兑换] 异常:', err);
            wx.showToast({
              title: '兑换失败',
              icon: 'error',
              duration: 2000
            });
          }
        }
      }
    });
  },

  // 实物兑换（原有逻辑）
  async exchangePhysical() {
    const app = getApp();
    const openid = app.globalData.openID;
    const price = this.data.merch.price;
    const merch_id = this.data.merch.merch_id;
    const merch_name = this.data.merch.title;

    wx.showModal({
      title: '请您确认',
      content: '以 ' + price + ' 积分兑换 ' + merch_name + '?',
      success(res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'claimMerch',
            data: {
              openid,
              merch_id,
              price,
              merch_name
            },
            success: res => {
              if (res.result !== undefined) {
                console.log('the console message', res);
                wx.showModal({
                  title: '兑换成功',
                  content: '请于我的奖品页查看并兑奖',
                  showCancel: false
                });
              } else {
                wx.showToast({
                  title: '请稍后再试',
                  icon: 'error',
                  duration: 2000
                });
              }
            },
            fail: err => {
              console.error('Error calling cloud function:', err);
              wx.showToast({
                title: '请稍后再试',
                icon: 'error',
                duration: 2000
              });
            }
          });
        }
      }
    });
  },


  onShow() {
    // 更新颜色
    updateColor();
  },

  onShareAppMessage() {
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function (res) {
        console.log(res.shareTickets[0])
      },
      fail: function (res) {
        console.log('share failed')
      }
    }
  }

});
