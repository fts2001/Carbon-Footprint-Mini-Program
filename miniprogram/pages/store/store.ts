// pages/store/store.ts
const app = getApp()
export{}
Page({
  data: {
    prize: 0,
    prizes: [],
    claimedprizes: [],
    angle:0,
    attempts:0,
    _id: 0,
    testGroup: 0,
    openID: '',
    random: '',
    trasn: 0,
    spinning: false,
    cost: 20,
    userInfo: null,
    credit: 0,
    luckylist: [
     
      {time:"超过50%概率获得10元以上奖励！"},
      {time: "奖品将于每月月底统一发放！",},
      {time: "还等什么，快来抽奖吧！",}],
  },
  async angleGenerator(){
    var angle = 0;
    var prize = 0;
    const prob = Math.floor(Math.random() * 100);
    const random = Math.random()
    //一等奖 3%概率抽到
    if(prob<=3){
      angle = Math.floor(40 + random*(40))
      prize = 1
    }
    // 第二有价值的奖品 7%概率抽到
    if(prob>3&&prob<=10){
      angle = Math.floor(100 + random*(40));
      prize = 2
    }
    // 10% 概率
    if(prob>10&&prob<=20){angle =Math.floor(160 + random*(40)); prize = 3}

    // 15% 概率
    if(prob>20&&prob<=35){angle = Math.floor(220+ random*(40)); prize = 4}
    // 30% 概率
    if(prob>35&&prob<=65){  angle = Math.floor(280 + Math.random()*(40)); prize = 5}
    // 35% 概率
    else{
      angle = Math.floor(340 + Math.random()*(20));
      prize = 6
    }
    this.setData({
      angle: angle,
      prize: prize
    });
  },
  async startSpin(){
    let that = this
    if(that.data.credit<that.data.cost){
      wx.showToast({
        title:'积分不足',
        icon: 'error'
      })
      return;
    }
    if(that.data.spinning){
      return
    }
    if(!that.data.spinning){
      that.setData({
        spinning: true
      })
    }
    let num = 0
    that.angleGenerator()
    that.setData({
      // random-最终角度-从后端获得概率
     trasn:0,
     spinning: true
    })
    let a = setInterval(function () {
     that.setData({
     trasn:that.data.trasn+5
     })
    //  累计转3圈
     if(360 <= that.data.trasn){
     that.data.trasn = 0
     num = num + 1
     }
    //  3圈得到结果、重置timer
     if(num == 3){
      let b = setInterval( async function () {
        that.setData({
        trasn:that.data.trasn+2
        })
        if(that.data.angle <= that.data.trasn){
        try{
          clearInterval(b)
          const db = wx.cloud.database()
          const _ = db.command
          const prizeList = ['placeholder','京东E卡100元','京东E卡50元','京东E卡40元','京东图书品类卡30元','京东E卡20元','京东E卡10元']
          await db.collection('lottery').doc(that.data._id).update({
            data:{
              credit: _.inc(-that.data.cost),
              prizes: _.push([prizeList[that.data.prize]]),
              attempt: _.inc(1)
            }
          })
          that.setData({
            trasn: 0,
            spinning: false
          })
          wx.showModal({
            title: '恭喜中奖',
            content: '您获得：' + [prizeList[that.data.prize]],
            showCancel: false,
           })
        }catch(err){
          console.log(err)
        }}
       },8)
       
     clearInterval(a)}
    },8)
    },
  async getLotteryInfo(){
    wx.showToast({
      title: '数据更新中',
      icon: 'loading',
      mask: true,
      duration: 10000
    })
    const db = wx.cloud.database()
    try{
     db.collection('lottery').where({
        _openid:this.data.openID
      }).watch({
        onChange: (snapshot)=>{
          console.log('docs\'s changed events', snapshot.docChanges[0])
          console.log('query result snapshot after the event', snapshot.docs[0])
          this.setData({
            credit : snapshot.docs[0].credit,
            _id: snapshot.docs[0]._id,
            attempts: snapshot.docs[0].attempts,
            prizes:snapshot.docs[0].prizes,
            claimedprizes: snapshot.docs[0].claimedprizes

          })
          wx.hideToast()
        },
        onError: (err) => {
          console.log(err)
        }
      })

    }catch(err){
      console.log(err)
    }
  },
  toMyprize(){
    var prizelist = JSON.stringify(this.data.prizes)
    var claimedprizes = JSON.stringify(this.data.claimedprizes)

    wx.navigateTo({
      url: '/pages/myprize/myprize?prizelist=' + prizelist +'&claimedprizes=' + claimedprizes
    })
  },
  onLoad() {
    
    const cost = 20
    
    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup: app.globalData.userInfo.testGroup,
      openID:app.globalData.openID,
      cost : cost
    })
    this.getLotteryInfo()
  },

  onShow() {
  }
})