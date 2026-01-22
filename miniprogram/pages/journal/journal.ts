// pages/journal/journal.ts
import { logEvent } from '../../utils/log'
import { updateColor } from '../../utils/colorschema'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    background: 'null',
    forminfo: '',
    num: 10,
    openID: '',
    userInfo: null,
    typeq: 1, // todo  : static now, will add a function to tell time 
    status: null,
    single: [],
    sort: [],
    singleSelected: [], // 单选题选项的选择结果
    sortSelected: [],
    isLoading: true,
    info: null,
    prizelist: null,
    _id: null,

  },
  bindinfo(e: any) {
    this.setData({
      info: e.detail.value
    })
  },
  handleSingleSelect: function (e) {

    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const singleSelected = this.data.singleSelected;
    singleSelected[index] = value;
    this.setData({ singleSelected });
  },

  async fetchData(type: any) {
    this.setData({
      isLoading: true // 开始加载数据，按钮将被隐藏
    });
    wx.showToast({
      title: '加载中', // 显示加载中提示
      icon: 'loading',
      duration: 10000 // 设置持续显示时间，单位毫秒
    });

    const db = wx.cloud.database();

    try {

      const res = await db.collection('qsThree').where({ _id: type }).get();
      console.log('questionaire data', res.data[0]);
      var num = Math.ceil(Math.random() * 4)
      if (type == 3) {
        console.log('first single', res.data[0].single[0].question)
        const question = res.data[0].single[0].question[num]
        res.data[0].single[0].question = question
        console.log('changed', res.data[0].single[0].question)
      }

      // 隐藏加载中提示
      wx.hideToast();
      this.setData({
        isLoading: false
      });

      this.setData({
        single: res.data[0].single,
        sort: res.data[0].sort,
        num: num
      });
    } catch (error) {
      // 处理加载数据失败的情况
      wx.hideToast(); // 隐藏加载中提示
      wx.showToast({
        title: '加载数据失败',
        icon: 'none',
        duration: 2000
      });
      console.error('加载数据失败', error);
    }
  },

  infoCheck() {
    if (this.data.info) {
      return true
    }
    return false
  },
  formCheck() {
    var ans = this.data.singleSelected.length
    const total = this.data.single.length
    console.log('answered', ans)
    console.log('total', total)
    if (ans != total) {
      wx.showModal({
        content: '您有问题未回答哦，请再次检查全部作答',
        showCancel: false
      })
      return false
    }
    return true
  },
  async claimPrize() {
    if (this.formCheck() && this.infoCheck()) {
      // 显示上传中的提示
      wx.showToast({
        title: '上传中',
        icon: 'loading',
        duration: 10000 // 设置持续显示时间，单位毫秒，可根据实际上传时间调整
      });

      const db = wx.cloud.database();
      const _ = db.command
      const res = await db.collection('lottery').where({ _openid: this.data.openID }).get()
      this.setData({
        _id: res.data[0]._id
      })
      await db.collection('lottery').doc(this.data._id).update({
        data: {
          prizes: [],
          claimedprizes: _.push(this.data.prizelist)
        }
      })
      await db.collection('claimedprize').add({
        data: {
          prizelist: this.data.prizelist,
          info: this.data.info,
          date: new Date()
        }
      })

      await db.collection('qsAns').add({
        data: {
          ans: this.data.singleSelected,
          type: this.data.typeq,
          num: this.data.num
        }

        ////
      }).then(() => {
        // 隐藏上传中提示
        wx.hideToast();
        wx.showModal({
          title: '感谢您的参与！',
          content: '亲爱的参与者，您好！\n\n首先，衷心感谢您花费宝贵时间参与本次互动。\n\n这并不是一个真实的商业产品，而是一项社会科学研究实验。我们希望通过模拟情境，来研究人们在特定场景下的决策与互动。\n\n在此向您说明：\n\n关于实验设计：实验中展示的部分文章和宣传信息是为研究目的而设定的虚构条件，并非真实运营产品。\n\n关于您的数据：您所有的行为数据都将进行严格的匿名化处理。所有能识别您个人身份的信息（如微信账号、昵称等）都将在数据分析前被彻底分离并删除。最终的研究报告与分析结果将仅涉及无法追溯到任何个人的群体数据。\n\n关于您的权益：您的参与是基于自愿原则。如果您对使用您的匿名数据存在疑虑，或有任何问题，欢迎通过以下联系方式与我们联系，我们将为您进一步说明。\n\n本研究旨在对个人省碳的理解，您的贡献至关重要。再次为您的好奇心与帮助致以诚挚的谢意！\n\n昆山杜克大学碳行家团队\n联系邮箱：yucen.xiao@dukekunshan.edu.cn',
          showCancel: false,
          success(res) {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/myprize/myprize'
              });
            }
          }
        })
      }).catch((error) => {
        // 处理上传失败的情况
        wx.hideToast(); // 隐藏上传中提示
        wx.showToast({
          title: '上传失败',
          icon: 'none',
          duration: 2000
        });
        console.error('上传失败', error);
      });
    } else {
      wx.showToast({
        title: '信息填写不全',
        icon: 'error',
        mask: true,
        duration: 2000

      })
    }
  },
  async formSubmit() {
    if (this.formCheck()) {
      // 显示上传中的提示
      wx.showToast({
        title: '上传中',
        icon: 'loading',
        duration: 10000 // 设置持续显示时间，单位毫秒，可根据实际上传时间调整
      });

      const db = wx.cloud.database();
      db.collection('qsAns').add({
        data: {
          ans: this.data.singleSelected,
          type: this.data.typeq
        }
      }).then(() => {
        // 隐藏上传中提示
        wx.hideToast();
        wx.showModal({
          title: '成功上传',
          content: '感谢您的填写!',
          showCancel: false,
          success(res) {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/center/center'
              });
            }
          }
        })
      }).catch((error) => {
        // 处理上传失败的情况
        wx.hideToast(); // 隐藏上传中提示
        wx.showToast({
          title: '上传失败',
          icon: 'none',
          duration: 2000
        });
        console.error('上传失败', error);
      });
    }


  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options.typeq)
    var typeq = parseInt(options.typeq!)
    this.fetchData(typeq)
    this.setData({
      typeq: typeq,
      openID: app.globalData.openID
    })
    if (options.prizelist) {
      var prizelist = JSON.parse(options.prizelist)
      this.setData({
        prizelist: prizelist
      })
    }

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
    // 更新颜色
    updateColor();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

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
})