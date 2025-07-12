import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nowTab: "0", //当前的tab页
    items: [
      { id: 1, name: '不中', angle: 0, bacckground: "#fdf5e1", color: "#419f8c" },
      { id: 2, name: '不中', angle: 45, bacckground: "#97baaf", color: "#FFF" },
      { id: 3, name: '不中', angle: 90, bacckground: "#fdf5e1", color: "#419f8c" },
      { id: 4, name: '不中', angle: 135, bacckground: "#97baaf", color: "#FFF" },
      { id: 5, name: '中奖', angle: 180, bacckground: "#fdf5e1", color: "#419f8c" },
      { id: 6, name: '不中', angle: 225, bacckground: "#97baaf", color: "#FFF" },
      { id: 7, name: '不中', angle: 270, bacckground: "#fdf5e1", color: "#419f8c" },
      { id: 8, name: '不中', angle: 315, bacckground: "#97baaf", color: "#FFF" }
    ],
    rotate: false,
    showAward: true, //默认展示奖品
    awardList: [
      {
        imgUrl: "cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/awardImage/奖品1.png",
        name: "隐私手机号挪车二维码",
      }, {
        imgUrl: "cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/awardImage/奖品2.png",
        name: "7天单车卡",
      }, {
        imgUrl: "cloud://iluvcarb-0gzvs45g82b57f98.696c-iluvcarb-0gzvs45g82b57f98-1315168954/awardImage/奖品3.png",
        name: "外卖优惠券",
      }
    ]
  },

  // 修改后的选择奖品逻辑（ui为1/8，实际为1/16）
  chooseAward(e) {
    const that = this;
    this.setData({ award: e.currentTarget.dataset.item, showAward: false });
  
    // 获取中奖与未中奖角度
    const winAngles = that.data.items.filter(item => item.name === '中奖').map(item => item.angle);
    const loseAngles = that.data.items.filter(item => item.name !== '中奖').map(item => item.angle);
  
    // 判断是否中奖（1/16 概率）
    const isWin = Math.random() < 1 / 16;
  
    // 根据中奖状态选取对应角度
    const targetAngle = isWin
      ? winAngles[Math.floor(Math.random() * winAngles.length)]
      : loseAngles[Math.floor(Math.random() * loseAngles.length)];
  
    // 转动5圈 + 指向目标角度
    const finalAngle = 360 * 5 + 315 + targetAngle;
  
    this.setData({ rotate: true, rotateDeg: finalAngle });
  
    setTimeout(() => {
      this.setData({ rotate: false });
  
      if (isWin) {
        Dialog.alert({
          title: '提示',
          message: '恭喜你中奖了! 客服将在20日内为你发放奖品，请关注消息中心。',
        }).then(() => {
          that.data.award.isWin = true
          const db = wx.cloud.database();
          db.collection('award').add({ data: that.data.award }).then(() => {
            this.showDialog();
          }).catch(console.error);
        });
      } else {
        Dialog.alert({
          title: '提示',
          message: '很遗憾, 未中奖!',
        }).then(() => {
          that.data.award.isWin = false
          const db = wx.cloud.database();
          db.collection('award').add({ data: that.data.award }).then(() => {
            this.showDialog();
          }).catch(console.error);
        });
      }
    }, 4000); // 动画时间与css保持一致
  },  
  // 展示实验说明
  showDialog() {
    setTimeout(() => {
      Dialog.alert({
        title: '实验说明',
        message: "尊敬的参与者：\n感谢您参与本次研究项目。我们现在向您说明一些在实验过程中未能提前告知的信息，以确保您对本研究的真实目的和方法有全面的了解。\n在本实验中，我们故意设置了部分情境模拟。例如，您在实验中所接触的小程序可能会被误认为是与有关部门或公司合作开发，实际上，该小程序是由研究团队独立设计与开发，仅用于学术研究目的，并不与任何实体存在实际合作关系。\n此外，在实验过程中我们展示了一些根据您的行为数据生成的个性化信息或推荐内容。这些内容是由大型语言模型（LLM）自动生成的，其目的在于探讨算法如何在不同语境下影响用户的反应与行为。请放心，您的数据在整个过程中均严格按照数据隐私与伦理规范做了匿名化处理，任何可识别您个人身份的信息都未被收集或保留。\n我们之所以采用这种设计，是为了更真实地模拟您在日常生活中可能遇到的数据使用与个性化推荐情境，从而更准确地理解人们在相关情况下的行为和态度。所有设计均已通过伦理审查，且在符合国际通行的研究伦理框架下进行。\n如您对此实验过程或内容有任何疑问，或希望撤回您的数据，请随时通过以下联系方式与研究团队联系：\n研究联系人：Charles Chang\n电子邮箱：charles.c.chang@dukekunshan.edu.cn\n机构：昆山杜克大学\n再次感谢您的参与与理解！\n此致\n敬礼！\n碳行家研究团队敬上\n",
      }).then(() => {
        // on close
      });
    }, 1000);
  },
  // 显示我的奖品
  showMyAward() {
    wx.navigateTo({
      url: "/pages/pointsPrize/myAward/myAward"
    })
  },
  //数组随机排序
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
  // 选择tab
  chooseTab(e) {
    this.setData({ nowTab: e.currentTarget.dataset.name });
  },

  // 页面生命周期
  onLoad() {},
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
});
