// pages/detail/detail.ts
const app = getApp()
export{}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    link: '',
    openid: '',
    openTime:'',
    userInfo:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(option){
    const db  = wx.cloud.database()
    const link = option.link
    console.log('the link is ', link)
    const openTime  = new Date()
    this.setData({
      link: link,
      openid: app.globalData.openID,
      openTime: openTime
    })
    


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo
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
    const db = wx.cloud.database()
    const endTime = new Date()
    const startTime = new Date(this.data.openTime)
    if (this.data.userInfo.testGroup == 3) {
      db.collection('readHistory').add({
        data:{
          openid: this.data.openID,
          startTime: startTime,
          endTime: endTime,
          link: this.data.link
        }
      })
      wx.navigateTo({
        url: '/pages/quiz/quiz?link=' + this.data.link,
      })
    }
    else{
      db.collection('readHistory').add({
        data:{
          openid: this.data.openID,
          startTime: startTime,
          endTime: endTime,
          link: this.data.link
        }
      })
      
      wx.showModal({
        title: '阅读成功',
        content:'低碳生活，携手同行！',
        showCancel: false
      })
    }
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})