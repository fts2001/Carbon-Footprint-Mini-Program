const { logEvent } = require("../../utils/log");
const { updateUserData, onCheckSignIn } = require("../../utils/login")
const { updateColor } = require("../../utils/colorschema")
const app = getApp();
const db = wx.cloud.database();

import defaultData from "./data.js"

Page({
  /**
   * 页面的初始数据
   */
  data: {
    /** 常量数据 defaultData ，这个是给UI访问的, 默认直接用 defaultData 而不是 this.data.defaultData */
    defaultData,

    /** 页面基本信息 */
    background: null,

    /** UI 相关 */
    UISelectedTag: '',
    UIArticleTags: ['综合'],
    articleShowList: [],

    /** 用户基本信息 */
    userInfo: null,
    openID: null,

    /** 是否从朋友圈转发进入 */
    isFromShareTimeline: true,

    /** 文章推荐系统本地存储 */
    articleRecommend: {}
  },

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 云数据处理 CLOUD HANDLING ///////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 获取云端数据，!! 这是初始化页面必须先做的 !!
   */
  async fetchUserCloudFromData(){
    try {
      // 获取云端用户推荐数据
      let cloudData = (await db.collection(defaultData.RECOMMENDATION_DATA_COLLECTION)
      .where({ _openid: this.data.openID })
      .get()).data[0] || {};

      // 继承结构
      const formattedData = Object.assign({}, defaultData.RECOMMENDATION_DATA_KEYS, cloudData);

      // 存在本地
      this.setData({
        articleRecommend: formattedData
      })
    } catch (error) {
      console.error("获取用户云端数据出错：", error);
    }
  },

    /**
   * 上传云端用户推荐数据
   */
  async uploadUserDataToCloud(){
    try {
      // 获得数据库数据
      let cloudData = (await db.collection(defaultData.RECOMMENDATION_DATA_COLLECTION)
      .where({ _openid: this.data.openID })
      .get()).data[0] || {};

      // 更新新数据和去除旧数据
      const updatedData = this.data.articleRecommend;
      if (cloudData === {}) {
        await db.collection(defaultData.RECOMMENDATION_DATA_COLLECTION).add({
          data: updatedData
        });
      } else {
        const removedData = Object.keys(cloudData).reduce((acc, field) => 
          (field !== '_openid' && field !== '_id' && field !== 'RECOMMENDATION_VERSION' && !(field in updatedData)) ? { ...acc, [field]: 'OUTDATED' } : acc, {});

        await db.collection(defaultData.RECOMMENDATION_DATA_COLLECTION).doc(cloudData._id).update({
          data: {
            ...updatedData,
            ...removedData
          }
        });
      }
    } catch(error) {
      console.error("上传云端用户推荐数据失败", error);
    }
  },

    /**
   * 初始化用户的云端 articleRecommend 数据（Note: 这里应该根据版本改变发生变动）
   */
  async initUserData() {
    // 根据文章种类的数量分配 infoGroup 组 （去除碳行家的）
    const infoGroup = Math.floor(Math.random() * defaultData.RECOMMENDATION_INFOGROUP_AMOUNT); 

    // 根据 author 得到对应的标签 list
    const tagsList = Object.values(defaultData.ARTICLE_TAGS).flat();

    // 获得子标签的 list
    const subtagsList = Object.values(defaultData.ARTICLE_SUBTAGS).flat()

    // 初始化推荐文章系统的 features
    const features = {}
    defaultData.RECOMMENDATION_FEATURES.forEach(feature => {
      // 初始化每个 feature 为一个包含 tags 和 subtags 的对象
      features[feature] = {
          tags: tagsList.reduce((acc, tag) => {
              acc[tag] = 0; // 默认值为0
              return acc;
          }, {}),
          subtags: subtagsList.reduce((acc, subtag) => {
              acc[subtag] = 0; // 默认值为0
              return acc;
          }, {})
      };
    });

    // 设置 articleRecommend 对象
    const articleRecommend = {
      RECOMMENDATION_VERSION: defaultData.RECOMMENDATION_VERSION,
      infoGroup: infoGroup,
      features: features,
      recommendedIDs: []
    }

    // 写入本地数据 （保证格式）
    const formattedData = Object.assign({}, defaultData.RECOMMENDATION_DATA_KEYS, articleRecommend);
    this.setData({
      articleRecommend: formattedData
    })
  },

  /**
   * 处理旧版本兼容
   */
  async checkVersionUpdate() {
    // 判断旧版本
    if (defaultData.RECOMMENDATION_VERSION == this.data.articleRecommend.RECOMMENDATION_VERSION) {
      return;
    }

    // 更新新版本 
    try {
      await this.initUserData();
      await this.uploadUserDataToCloud();
      console.log('处理旧版本成功！')
    } catch (error) {
      console.error("更新新版本用户数据出错", error);
    }
  },

  /**
   * 获取云端文章
   * @returns {Array} 返回推荐的文章列表
   */  
  async fetchArticles({
    author = "", 
    tags = [], 
    subtags = [], 
    geolocation = "", 
    excludedIDs = [], 
    count = 10 
  }) {
    const $ = db.command.aggregate;

    try {
      const currentTimestamp = Date.now();
      const matchCondition = { 
        _id: { $not: { $in: excludedIDs } },
        ...(author !== "" && { author })
      };

      const res = await db.collection(defaultData.ARTICLE_COLLECTION)
        .aggregate()
        // 1. 过滤作者，排除的ID
        .match(matchCondition)
  
        .addFields({
          // 2. 计算 tags 匹配比例的分数
          tagsIntersectionScore: $.multiply($.size($.setIntersection([tags, "$tags"])), defaultData.ARTICLE_WEIGHT_SCORES.TAG),

          // 3. 计算 subtags 匹配比例的分数
          subtagsIntersectionScore: $.multiply($.size($.setIntersection([subtags, "$subtags"])), defaultData.ARTICLE_WEIGHT_SCORES.SUBTAG),

          // 4. 计算 geolocation 匹配分数
          geolocationScore: $.cond(
            [$.eq(["$geolocation", geolocation]), defaultData.ARTICLE_WEIGHT_SCORES.GEOLOCATION, 0]
          ),

          // 5. 计算 uploadTime 距离当今的分数： 7天内满分；7-30天内 递减；30天以后 0
          uploadTimeScore: $.cond([
            // 7天内满分
            $.lt([$.subtract([$.toLong(currentTimestamp), $.toLong("$uploadTime")]), 7 * 24 * 60 * 60 * 1000]),
            defaultData.ARTICLE_WEIGHT_SCORES.TIME,
            $.cond([
              // 7-30天内 递减
              $.lt([$.subtract([$.toLong(currentTimestamp), $.toLong("$uploadTime")]), 30 * 24 * 60 * 60 * 1000]),
              $.multiply($.divide([$.subtract([30 * 24 * 60 * 60 * 1000, $.subtract([$.toLong(currentTimestamp), $.toLong("$uploadTime")])]), (30 - 7) * 24 * 60 * 60 * 1000]), defaultData.ARTICLE_WEIGHT_SCORES.TIME),
              // 30天以后 0
              0
            ])
          ])
        })

        // 6. 统计所有分数
        .addFields({
          totalScore: $.add([
            "$tagsIntersectionScore",
            "$subtagsIntersectionScore",
            "$geolocationScore",
            "$uploadTimeScore"
          ])
        })
  
        // 7. 按总分排序，上传时间也优先
        .sort({
          totalScore: -1,
          uploadTime: -1
        })
  
        // 8. 限制返回数量
        .limit(count)
        .end();
  
      return res.list
    } catch (error) {
      console.error("获取文章时出错：", error);
    }
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 文章推荐分配 RECOMMENDATION ///////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 根据用户的文章交互数据，返回推荐文章的 tags
   * @param {number} tagCount 返回的 tag 数量
   */ 
  getRecommendationTags(tagCount) {
    const features = this.data.articleRecommend.features;
    let tagScores = {};

    // [第一步]：计算所有 tag 的累积分数
    for (const key in features) {
      const tags = features[key].tags;
      for (const tag in tags) {
        tagScores[tag] = (tagScores[tag] || 0) + tags[tag];
      }
    }

    const tagList = Object.keys(tagScores); // 初始化 tag 分数
    if (tagList.length === 0) return [];  // 没有任何 tag，返回空数组
    let totalScore = Object.values(tagScores).reduce((sum, score) => sum + score, 0); // 计算 total 分数

    // [第二步]: 处理 totalScore === 0 的情况
    if (totalScore === 0) {
      return tagList.reduce((acc, _, i, arr) => (i === arr.length - 1 ? acc : [arr.splice(Math.floor(Math.random() * arr.length), 1)[0], ...acc]), []).slice(0, tagCount);
    }

    // [第三步]: 计算累积分布
    let cumulativeDistribution = [];
    let cumulativeSum = 0;

    for (const tag of tagList) {
      cumulativeSum += tagScores[tag] / totalScore; // 归一化
      cumulativeDistribution.push({ tag, prob: cumulativeSum });
    }

    // [第四步]: 按累积分布随机选择 tag
    let selectedTags = [];
    for (let i = 0; i < tagCount; i++) {
      let rand = Math.random();
      let selectedTag = cumulativeDistribution.find(entry => rand <= entry.prob).tag;
      selectedTags.push(selectedTag);
    }

    return selectedTags;
  },

  /**
   * 根据用户的文章交互数据，返回推荐文章的 subtags
   * @param {number} subtagCount 返回的 subtag 数量
   */ 
  getRecommendationSubTags(subtagCount) {
    const features = this.data.articleRecommend.features;
    let subtagScores = {};

    // [第一步]：计算所有 subtag 的累积分数
    for (const key in features) {
      const subtags = features[key].subtags;
      for (const subtag in subtags) {
        subtagScores[subtag] = (subtagScores[subtag] || 0) + subtags[subtag];
      }
    }

    const subtagList = Object.keys(subtagScores); // 初始化 subtag 分数
    if (subtagList.length === 0) return [];  // 没有任何 subtag，返回空数组
    let totalScore = Object.values(subtagScores).reduce((sum, score) => sum + score, 0); // 计算 total 分数

    // [第二步]: 处理 totalScore === 0 的情况
    if (totalScore === 0) {
      return subtagList
        .sort(() => Math.random() - 0.5) // 随机打乱数组
        .slice(0, subtagCount); // 取前 subtagCount 个
    }

    // [第三步]: 计算累积分布
    let cumulativeDistribution = [];
    let cumulativeSum = 0;

    for (const subtag of subtagList) {
      cumulativeSum += subtagScores[subtag] / totalScore; // 归一化
      cumulativeDistribution.push({ subtag, prob: cumulativeSum });
    }

    // [第四步]: 按累积分布随机选择 subtag
    let selectedsubTags = [];
    for (let i = 0; i < subtagCount; i++) {
      let rand = Math.random();
      let selectedsubTag = cumulativeDistribution.find(entry => rand <= entry.prob).tag;
      selectedsubTags.push(selectedsubTag);
    }

    return selectedsubTags;
  },

  /**
   * 给用户生成新文章，并添加在articleShowList中
   * @param {number} articleCount 除去碳行家文章数量
   */
  async getArticles(articleCount = 3){
    try {
      const tags = this.getRecommendationTags(2);
      const subtags = this.getRecommendationSubTags(2);
      const excludedIDs = this.data.articleRecommend.recommendedIDs

      // 碳行家默认文章
      let articles = await this.fetchArticles({
        author: defaultData.ARTICLE_AUTHORS[-1]
      })

      console.log(tags[0])

      // 普通文章推荐
      articles = articles.concat(await this.fetchArticles({
        tags: tags,
        subtags: subtags,
        geolocation: '',
        excludedIDs: excludedIDs,
        count: articleCount
      }))

      // 更新 articleShowList
      this.setData({
        articleShowList: articles
      })

      // 更新 UIArticleTags
      this.setData({ 
        UIArticleTags: [this.data.UIArticleTags[0], ...[...new Set(this.data.articleShowList.flatMap(a => (a.tags || []).filter(Boolean)))].sort()] 
      });      

      console.log("文章分配成功：\n", articles)
    } catch(error) {
      console.error("分配文章失败: ", error)
    }
  },

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 界面交互 UI EVENT HANDLING ///////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * UI 界面的标签点击事件
   */
  bindSelectUITag(e){
    this.setData({
      UISelectedTag: e.currentTarget.dataset.tag
    })

    const updatedList = this.data.articleShowList.map(article => {
      article.isTagShow = (this.data.UISelectedTag === this.data.UIArticleTags[0] && article.author !== defaultData.ARTICLE_AUTHORS['-1']) || article.tags?.includes(this.data.UISelectedTag);
      return article;
    });

    this.setData({
      articleShowList: updatedList
    })
  },

  /**
   * UI 的文章点击事件
   */
  bindClickArticle(e){
    logEvent('Read Article')

    // 获取点击的文章信息
    const articleID = e.currentTarget.dataset.id;
    const targetArticle = this.data.articleShowList.find(article => article._id === articleID);

    // 文章属性打包
    const title = encodeURIComponent(targetArticle.title)
    const uploadTime = encodeURIComponent(new Date(targetArticle.uploadTime).toISOString().split('T')[0]);
    const geolocation = encodeURIComponent(targetArticle.geolocation)
    const tags = encodeURIComponent(JSON.stringify(targetArticle.tags))

    // 文章图片和内容
    const imgs = encodeURIComponent(JSON.stringify(targetArticle.imgs));
    const texts = encodeURIComponent(JSON.stringify(targetArticle.texts));

    // TODO 这里继续

    // 构建URL
    const url = `/pages/detail/detail?title=${title}&uploadTime=${uploadTime}&geolocation=${geolocation}&tags=${tags}&imgs=${imgs}&texts=${texts}`;

    // 导航到对应链接
    wx.navigateTo({
      url: url,
      success: () => {
        // TODO: 更新文章 feature 分数
      }
    })
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 功能函数 LOCAL FUNCTIONAL METHOD ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  /**
   * 初始化本页面数据
   */
  async initData(){
    // 获取用户云端数据
    await this.fetchUserCloudFromData();

    // 检查版本更新
    await this.checkVersionUpdate();

    // 获取文章
    await this.getArticles(10);

    // 更新 UI
    this.bindSelectUITag({
      currentTarget: {
        dataset:{
          tag: this.data.UIArticleTags[0]
        }
      }
    })
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 页面周期函数 PAGE BUILT-IN FUNCTIONS ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 转发朋友圈链接，导航到登录页面
    if (options.isFromShareTimeline) {
      wx.redirectTo({
        url: `/pages/index/index?sharedFromID=${options.sharedFromID}`,
        success: () => {
          this.setData({
            isFromShareTimeline: false
          });
        }
      })
      return;
    } else {
      this.setData({
        isFromShareTimeline: false
      });
    }

    // 获取用户 openid 和 userInfo
    updateUserData();

    // 初始化页面信息
    this.initData();
  }, 

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 底部选择栏更新
    this.getTabBar()
    if(typeof this.getTabBar === 'function' && this.getTabBar()){
      this.getTabBar().setData({
        selected:1
      })
    }

    // 朋友圈进来则显示独特信息，不参与下面的页面更新，详情查看 wxml 文件
    if (this.data.isFromShareTimeline) {
      return;
    }

    // 更新颜色
    updateColor();

    // TODO: 更新阅读量

    // 提交用户log
    logEvent('Information Center')
    console.log('info page showing up')

    // 设置标题栏
    wx.setNavigationBarTitle({
      title: '碳行家｜信息中心'
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    
  },

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////// 分享转发进入 PAGE SHARE IN ///////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * 朋友圈分享
   */
  onShareTimeline(){
    logEvent('Share App')
    return{
      title:'有意思的低碳知识，尽在碳行家～',
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      query:`sharedFromID=${app.globalData.openID}&isFromShareTimeline=true`,
      success: function(res){
        console.log(res)
      },fail: function (res){console.log(res)}
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    logEvent('Share App')
    return {
      title: "有意思的低碳知识，尽在碳行家～",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  },
})