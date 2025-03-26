//app.js

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env:'iluvcarb-0gzvs45g82b57f98',
        traceUser: true,
      })
    }

  },
  onShow:function(e){
    console.log('event',e)
    this.globalData.shareTicket = e.shareTicket
    console.log('the share ticket is ', e.shareTicket)
  },

  // 全局常量
  constData: {
    /**
     * 版本分组
     */ 
    TOTAL_TEST_GROUP_COUNT: {
      PHYSICS: 1, // 物理激励
      MONEY: 2, // 金钱激励
      INFOMATION: 3, // 信息激励
    },

    /**
     * 版本颜色
     */ 
    VERSION_STYLE_COLOR: {
      CYAN: {
        Bar: '#419f8c',
        background: '#97baaf'
      },
      RED: {
        Bar: '#B82B1D',
        background: 'linear-gradient(140deg, #D13A29 30%,#836c6c46 100%)',
      }
    }
    
  },

  // 全局用户数据
  globalData: {
    userInfo: null,
    openID: null,
    showPoint: false,
    backgroundColorStyle: 'CYAN', // 默认青色背景
    shareTicket: null
  }
})
