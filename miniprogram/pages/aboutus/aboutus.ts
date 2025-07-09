
// pages/aboutus/aboutus.ts
import { logEvent } from '../../utils/log'
import { hexMD5 } from '../../utils/md5.js';
import { transfer } from '../../utils/transfer'
import { updateColor } from '../../utils/colorschema'

const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    background : null,
  },

  /**
   * 生命周期函数--监听页面加载
   */




  onShow() {
    // 更新颜色
    updateColor();
    
    this.setData({
      userInfo : app.globalData.userInfo
    })
    wx.setNavigationBarTitle({
      title: '碳行家｜关于我们'
    })
    // try {
    //   console.log('calling container');
    //   wx.cloud.callContainer({
    //     "config": {
    //       "env": "prod-5g9hyw5ua680d3fc"
    //     },
    //     "path": "/predict",
    //     "header": {
    //       "X-WX-SERVICE": "trip",
    //       'X-WX-EXCLUDE-CREDENTIALS': 'unionid, cloudbase-access-token, openid'
    //     },
    //     "method": "POST",
    //     "data": {
    //       "speeds": [200,200,200,200,200]
    //     },
    //     success: (res) => {
    //       console.log('Response received:', res);
    //       // Handle the returned data here
    //       if (res && res.data) {
    //         console.log('Prediction result:', res.data);
    //         // Process the prediction result
    //       }
    //     },
    //     fail: (err) => {
    //       console.error('Request failed:', err);
    //       // Handle the error case
    //     }
    //   });
    // } catch (e) {
    //   console.error('Caught error:', e);
    // }
    

  },

  

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  onLoad(option) {
    console.log(option)
    // console.log('the u_openid is ',option.u_openid)
    // this.setData({
    //   u_openid : option.u_openid
    // });
  },
  // HandleSendCash() {
  //   if (!this.data.u_openid) {
  //     wx.showToast({
  //       title: '缺少用户openid',
  //       icon: 'error',
  //       duration: 1000
  //     });
  //     return;
  //   }
  
  //   const { u_openid } = this.data;
  //   const type = '0';
  //   const money = '50';

  //   wx.cloud.callFunction({
  //     name: 'sendCashReward',
  //     data: {
  //       u_openid,
  //       type,
  //       money
  //     },
  //     success: (res) => {
  //       console.log('successful call',res.result);
  //       if(res.result && typeof res.result === 'object' && 'success' in res.result){
  //         if (res.result.success) {
  //           wx.showModal({
  //             title: '恭喜！',
  //             content: '您的现金红包已发放',
  //             showCancel: false
  //           });
  //         };
  //       }else{
  //         console.log('results in failure',res.result);
  //         wx.showToast({
  //           title: '请稍后再试',
  //           icon: 'error',
  //           duration: 1000
  //         });
  //       };
  //     },
  //     fail: (err) => {
  //       wx.showToast({
  //         title: '请求失败',
  //         icon: 'error',
  //         duration: 1000
  //       });
  //       console.error('Failed to call cloud function:', err);
  //     }
  //   });
  // },
  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "快来一起低碳出行~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
})