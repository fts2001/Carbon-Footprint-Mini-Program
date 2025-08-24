// pages/detail/detail.ts
import { updateColor } from "../../utils/colorschema";
import { logEvent } from "../../utils/log";

const app = getApp();
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    /** 页面成员数据 */
    sharedFromID: null,
    openTime: null,

    /** 文章模板 */
    article: {
      id: "",
      title: "标题模板",
      geolocation: "全国",
      uploadTime: "2024-11-11 11:11:11",
      tags: ["#标签1", "#标签2"],
      texts: [
        '这里放第一段文字，第一段文字上方是第一张图片，如果希望图片显示在最前，则第一段文字用""，以此类推。',
        '这里放第二段文字，第二段文字上方是第二张图片，如果希望两张图片紧接着显示，则第二段文字用""，以此类推。'
      ],
      imgs: [
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/personalized/%E9%AA%91%E8%A1%8C%E6%B1%BD%E8%BD%A6.png?sign=95e224f0caf96fa684c8bc06ef5b7094&t=1722219043",
        "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/personalized/%E8%A1%A3%E9%A3%9F%E8%A1%8C.jpg?sign=49c273e74497c80274f9a7f387a57d4e&t=1722219019"
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 页面成员数据录入
    const sharedFromID = options.sharedFromID ?? null;
    const openTime = new Date();

    // 文章属性解包
    const id = decodeURIComponent(options.id || "");
    const title = decodeURIComponent(options.title || "");
    const uploadTime = decodeURIComponent(options.uploadTime || "");
    const geolocation = decodeURIComponent(options.geolocation || "");
    const tags = JSON.parse(decodeURIComponent(options.tags || "[]"));

    // 文章图片和内容解包
    const imgs = JSON.parse(decodeURIComponent(options.imgs || "[]"));
    const texts = JSON.parse(decodeURIComponent(options.texts || "[]"));

    this.setData({
      // 页面数据
      sharedFromID: sharedFromID,
      openTime: openTime,

      // 文章
      article: {
        id: id,
        title: title,
        geolocation: geolocation,
        uploadTime: uploadTime,
        tags: (tags.length === 1 && tags[0] === "") || tags.length === 0 ? ["#碳行家"] : tags.map((tag: string) => `#${tag}`),
        texts: texts,
        imgs: imgs
      }
    });

    // 处理转发进入
    if (sharedFromID) {
      wx.showModal({
        title: "欢迎阅读碳行家文章",
        content: "进入小程序可阅读更多有趣文章！",
        showCancel: false
      });
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 计算阅读时间
    const endTime = new Date();
    const startTime = new Date(this.data.openTime);
    this.timer && this.timer();

    // 更新云端阅读记录
    try {
      db.collection("readHistory").add({
        data: {
          startTime: startTime,
          endTime: endTime,
          articleID: this.data.article.id,
          sharedFromID: this.data.sharedFromID ?? null
        }
      });

      console.log("成功记录文章阅读");
    } catch (err) {
      console.log("文章阅读记录失败：" + err);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新颜色
    updateColor();
  },

  onShareAppMessage() {
    logEvent("Share App");
    return {
      title: "有意思的低碳知识，尽在碳行家~",
      path: `/pages/index/index?sharedFromID=${app.globalData.openID}&articleLink=${this.data.link}&articleType=${
        this.data.articleType
      }&isFromArticleShared=${true}`,
      imageUrl: this.data.article.imgs[0],
      success: function (res) {
        console.log(res.shareTickets[0]);
      },
      fail: function (res) {
        console.log("share failed");
      }
    };
  }
});
