// components/tab_bar/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    showPoint: getApp().globalData.showPoint,
    selected: 0,
    color: "#FFFFFF",
    selectedColor: "#f9bc60",
    list: [
      {
        pagePath: "/pages/home/home",
        iconPath: "/asset/img/trip.png",
        text: "行程记录",
        selectedIconPath: "/asset/img/trip_highlight.png"
      },
      {
        pagePath: "/pages/information/information",
        text: "信息中心",
        iconPath: "/asset/img/info.png",
        selectedIconPath: "/asset/img/info_highlight.png"
      },
      // {
      //   "pagePath": "/pages/prizeCenter/prizeCenter",
      //   "text": "积分兑换",
      //   "iconPath": "/asset/img/merch.png",
      //   "selectedIconPath": "/asset/img/merch_highlight.png"
      // },
      {
        pagePath: "/pages/center/center",
        text: "个人中心",
        iconPath: "/asset/img/personal.png",
        selectedIconPath: "/asset/img/personal_highlight.png"
      }
    ]
  },


    ready() {
    },
  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.page;
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    },
    updateSelected(index: number) {}
  }
});
