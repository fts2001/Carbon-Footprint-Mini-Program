
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

  },

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