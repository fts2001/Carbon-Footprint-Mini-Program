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
    isLoading: false,

    /** 发钱API用户ID */
    u_openid : null,

    /** UI 相关 */
    UISelectedTag: '',
    UIArticleTags: ['综合'],
    articleShowList: [],

    /** 用户基本信息 */
    userInfo: null,
    openID: null,

    /** 地理位置 */
    geolocation: null,

    /** 是否从朋友圈转发进入 */
    isFromShareTimeline: true,

    /** 文章推荐系统本地存储 */
    articleRecommend: {}
  },

  ////////////////////////////////////////////////////////////////
  /////////////////// 云数据处理 CLOUD HANDLING ///////////////////
  ////////////////////////////////////////////////////////////////

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
      delete formattedData._openid;
      delete formattedData._id;

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
      if (Object.keys(cloudData).length === 0) {
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

      console.log("成功上传用户数据至云端")
    } catch(error) {
      console.error("上传云端用户推荐数据失败", error);
    }
  },

  /**
   * 上传一次推荐的文章的 ID 到数据库记录
   * @param {*} articleIDs 此次推荐的所有文章的 ID 列表
   */
  async uploadUserRecommendHistory(articleIDs) {
    try {
      const recommendTime = new Date(); // 当前时间戳
      const currentFeatures = this.data.articleRecommend.features; // 本次推荐后的特征分数
      const currentReadArticles = this.data.articleRecommend.recommendedArticles; // 截至这次推荐已经读过的文章

      await db.collection(defaultData.RECOMMENDATION_HISTORY_COLLECTION).add({
        data: {
          articleIDs: articleIDs,
          recommendTime: recommendTime,
          currentFeatures: currentFeatures,
          currentReadArticles: currentReadArticles
        }
      });

      console.log("成功记录此次推荐");
    } catch (err) {
      console.error("此次推荐记录失败：" + err);
    }
  },

  /**
   * 初始化用户的云端 articleRecommend 数据（Note: 这里应该根据版本改变发生变动）
   */
  async initUserData() {
    // 分配 infoGroup
    let infoGroup = (() => { 
      const e = Object.entries(defaultData.INFOGROUP_DISTRIBUTION_KEYS); 
      const t = e.reduce((s, [, w]) => s + w, 0), r = Math.random(); 
      let a = 0; 
      for (const [k, w] of e) if ((a += w / t) >= r) return k 
    })();

    // 根据 author 得到对应的标签 list
    const tagsList = Object.values(defaultData.ARTICLE_TAGS).flat();

    // 获得子标签的 list
    const subtagsList = Object.values(defaultData.ARTICLE_SUBTAGS).flat()

    // 初始化推荐文章系统的 features
    const features = {}
    const totalTags = tagsList.length;
    const totalSubtags = subtagsList.length;
    const recommendedArticles = Object.fromEntries(
      Object.values(defaultData.ARTICLE_AUTHORS).map(author => [author, []])
    );
    let shouldNormalized = false;
    Object.keys(defaultData.RECOMMEND_FEATURES).forEach(feature => {
      shouldNormalized = defaultData.RECOMMEND_FEATURES[feature].NORMALIZED;
      features[feature] = {
        tags: tagsList.reduce((acc, tag) => {
          acc[tag] = shouldNormalized ? (totalTags > 0 ? 1 / totalTags : 0) : 0;
          return acc;
        }, {}),
        subtags: subtagsList.reduce((acc, subtag) => {
          acc[subtag] = shouldNormalized ? (totalSubtags > 0 ? 1 / totalSubtags : 0) : 0;
          return acc;
        }, {})
      };
    });

    // 设置 articleRecommend 对象，这个得根据 defaultData.RECOMMENDATION_DATA_KEYS 来修改
    const articleRecommend = {
      RECOMMENDATION_VERSION: defaultData.RECOMMENDATION_VERSION,
      infoGroup: infoGroup,
      features: features,
      recommendedArticles: recommendedArticles
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
  async checkVersionUpdate({ success } = {}) {
    // 判断旧版本
    if (defaultData.RECOMMENDATION_VERSION == this.data.articleRecommend.RECOMMENDATION_VERSION) {
      return;
    }
  
    // 更新新版本 
    try {
      await this.initUserData();
      await this.uploadUserDataToCloud();
      console.log('处理旧版本成功！');
      
      // 调用 success 回调函数（如果提供）
      if (typeof success === 'function') {
        success();
      }
    } catch (error) {
      console.error("更新新版本用户数据出错", error);
    }
  },

  /**
   * 获取云端文章
   * @returns {Array} 返回推荐的文章列表
   */
  async fetchArticles({
    infoGroup = "",
    author = "", 
    tags = [], 
    subtags = [], 
    geolocation = "", 
    excludedIDs = [], 
    readIDs = [],
    count = 10,
  }) {
    const $ = db.command.aggregate;
    const currentTimestamp = Date.now();
    const seed = Math.floor(Date.now());
    const HASH_CONST = 2654435761;
    const LARGE_PRIME = 1000003;

    // 根据用户 infoGroup 来进行分组
    const settingRes = await wx.getSetting();
    const locationAuthorization = this.data.userInfo.basicInfo?.authorize?.userLocation;
    if (infoGroup === '地域' && (locationAuthorization !== true || !settingRes.authSetting["scope.userLocationBackground"])) {
      infoGroup = '随机'; // 没有地理权限则是'随机'
    }
    const randomFactor = infoGroup === '随机' ? 1.0 : 0.2; // 控制随机分布的， 0 为完全不随机, 1 为完全随机
    const geoMultiplier = infoGroup === '地域' ? 10 : 1;

    try {
      const res = await db.collection(defaultData.ARTICLE_COLLECTION)
        .aggregate()

        // 1. 过滤作者，排除的ID
        .match({ 
          _id: { $not: { $in: excludedIDs } },
          ...(author === "" 
            ? { author: { $ne: defaultData.ARTICLE_AUTHORS[-1] } }
            : { author })
        })

        .addFields({
          // 2. 计算 tags 匹配比例的分数
          tagsIntersectionScore: $.multiply($.size($.setIntersection([tags, "$tags"])), defaultData.ARTICLE_WEIGHT_SCORES.TAG),

          // 3. 计算 subtags 匹配比例的分数
          subtagsIntersectionScore: $.multiply($.size($.setIntersection([subtags, "$subtags"])), defaultData.ARTICLE_WEIGHT_SCORES.SUBTAG),

          // 4. 计算 geolocation 匹配分数
          geolocationScore: $.cond([
            $.eq(["$geolocation", geolocation]),
            $.multiply([defaultData.ARTICLE_WEIGHT_SCORES.GEOLOCATION, geoMultiplier]),
            0
          ]),

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
          ]),

          // 6. 曾经阅读过的文章扣分（不那么容易被推荐）
          readPenaltyScore: $.cond(
            [$.in(["$_id", readIDs]), defaultData.ARTICLE_WEIGHT_SCORES.READ, 0]
          )
        })

        // 7. 统计所有分数
        .addFields({
          totalScore: $.add([
            "$tagsIntersectionScore",
            "$subtagsIntersectionScore",
            "$geolocationScore",
            "$uploadTimeScore",
            "$readPenaltyScore"
          ])
        })

        // 8. 基于 _id 前缀生成伪随机扰动
        .addFields({
          idPrefix: { $substrBytes: [{ $toString: "$_id" }, 0, 8] },
          pseudoRandom: {
            $mod: [
              $.add([
                $.multiply([
                  { $convert: { input: "$idPrefix", to: "long", onError: 0, onNull: 0 } },
                  HASH_CONST
                ]),
                seed
              ]),
              LARGE_PRIME
            ]
          }
        })
        .addFields({
          normalizedPseudoRandom: {
            $divide: [
              "$pseudoRandom",
              LARGE_PRIME
            ]
          }
        })

        // 9. 扰动分数排序 totalScore * normalizedPseudoRandom^randfactor
        .addFields({
          weightedScore: {
            $add: [
              {
                $multiply: ["$totalScore", { $subtract: [1, randomFactor] }]
              },
              {
                $multiply: ["$normalizedPseudoRandom", defaultData.ARTICLE_WEIGHT_SCORES.RANDOM, randomFactor]
              }
            ]
          }
        })        

        // 10. 排序并返回
        .sort({
          weightedScore: -1
        })

        // 11. 限制返回数量
        .limit(count)
        .end();

      return res.list;
    } catch (error) {
      console.error("获取文章时出错：", error);
      return [];
    }
  },

  /**
   * 处理现金发放事件
   * @param {*} u_openid 发钱API用户ID
   */
  async handleSendEntranceCash(u_openid) {
    const openid = app.globalData.openID;
    const db = wx.cloud.database();
    const _ = db.command;

    if (!openid || !u_openid) {
      return;
    }

    try {
      // 检查是否已发放
      const entryCheck = await db.collection("entryList").doc(openid).get()
        .then(res => res.data)
        .catch(() => null);

      if (entryCheck) {
        wx.showModal({
          title: "提示",
          content: "您已领取过红包",
          showCancel: false
        });
        return;
      }

      // 写入领取记录
      await db.collection("entryList").add({
        data: {
          _id: openid,
          u_openid,
          date: new Date()
        }
      });

      // 获取奖励金额等信息
      const transferMoneyData = await db.collection("transferMoney").get();
      const transferMoney = transferMoneyData.data[0];

      if (!transferMoney || !transferMoney.active) {
        wx.showModal({
          title: "抱歉",
          content: "现金奖励未启用",
          showCancel: false
        });
        return;
      }

      const money = transferMoney.entrance.money;
      const remark = transferMoney.entrance.info;

      // 调用云函数发钱
      wx.cloud.callFunction({
        name: 'sendCashReward',
        data: {
          u_openid,
          type: '0',
          money: String(money),
        },
        success: (res) => {
          if (res.result && res.result.success) {
            wx.showModal({
              title: "恭喜！",
              content: "恭喜您获得0.3元注册红包",
              showCancel: false
            });
          } else {
            wx.showToast({
              title: '发放失败，请稍后再试',
              icon: 'error',
              duration: 1500
            });
          }
        },
        fail: (err) => {
          console.error('云函数调用失败:', err);
          wx.showToast({
            title: '请求失败',
            icon: 'error',
            duration: 1500
          });
        }
      });

    } catch (err) {
      console.error('处理失败:', err);
      wx.showModal({
        title: "错误",
        content: err.message || "发生未知错误",
        showCancel: false
      });
    }
  },

  //////////////////////////////////////////////////////////////////
  /////////////////// 文章推荐分配 RECOMMENDATION ///////////////////
  //////////////////////////////////////////////////////////////////

  /**
   * 根据阅读文章的标签，更新文章的 Tag 和 Subtag 的特征
   * @param {Array} tags 待更新的 tag 列表
   * @param {Array} subtags 待更新的 subtag 列表
   * @param {Boolean} isRepeated 是否重复观看
   */
  updateTagFeatures(tags, subtags, isRepeated) {
    // 遍历 this.data.articleRecommend.features 中的每个 feature
    for (const feature of Object.keys(defaultData.RECOMMEND_FEATURES)) {
      // 若是此 feature 不考虑重复观看，则跳过
      if (isRepeated && defaultData.RECOMMEND_FEATURES[feature].COUNT_REPEAT) continue;

      // 获取当前 feature 的 tags 和 subtags
      const featureTags = this.data.articleRecommend.features[feature].tags;
      const featureSubtags = this.data.articleRecommend.features[feature].subtags;
  
      // 更新 tags 和 subtags
      tags.forEach(tag => {
        // 如果 tag 在当前 feature 的 tags 中，增加值
        if (featureTags[tag] !== undefined) {
          featureTags[tag] += defaultData.RECOMMEND_FEATURES[feature].UPDATESTEP.TAG;
        }
      });
      subtags.forEach(subtag => {
        // 如果 subtag 在当前 author 的 subtags 中，增加值
        if (featureSubtags[subtag] !== undefined) {
          featureSubtags[subtag] += defaultData.RECOMMEND_FEATURES[feature].UPDATESTEP.SUBTAG;
        }
      });
  
      // 如有必要，归一化 tags 和 subtags
      if (defaultData.RECOMMEND_FEATURES[feature].NORMALIZED) {
        const totalTagValue = Object.values(featureTags).reduce((acc, value) => acc + value, 0);
        for (const tag in featureTags) {
          featureTags[tag] /= totalTagValue;
        }
        const totalSubtagValue = Object.values(featureSubtags).reduce((acc, value) => acc + value, 0);
        for (const subtag in featureSubtags) {
          featureSubtags[subtag] /= totalSubtagValue;
        }
      }
    }
  },  

  /**
   * 根据用户的文章交互数据，返回推荐文章的 tags
   * @param {number} tagCount 返回的 tag 数量
   */ 
  getRecommendationTags(tagCount) {
    const features = this.data.articleRecommend.features;
    let tagScores = {};

    // [第一步]：计算所有 tag 的累积加权分数（归一化后）
    for (const key in features) {
      const tags = features[key].tags;
      const weight = defaultData.RECOMMEND_FEATURES[key].WEIGHT;
      let sum = Object.values(tags).reduce((acc, value) => acc + value, 0);
      if (sum === 0) sum = 1;
      for (const tag in tags) {
        const normalizedValue = tags[tag] / sum;
        tagScores[tag] = (tagScores[tag] || 0) + normalizedValue * weight;
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
   * 根据输入的 count 和用户已阅读的文章，为每个作者分配需要生成的文章数量，其中每个作者作为键，值为对应的文章数量。（不算碳行家）
   * 注：这块之后会根据 infoGroup 发生变动，可能会采用不同分组进行不同 author 的分配 （e.g: 30%个人， 70%强国）
   * @param {number} count 文章数量
   * @returns 返回一个对象，其中每个键是作者的名称（string），每个值是该作者需要生成的文章数量（number）
   */
  getAuthorGenerateArticleCount(count) {
    // 计算根据 author 数量动态分配对应数量文章的推荐
    const authorArticleCountRate = Object.fromEntries(
      Object.entries(this.data.articleRecommend.recommendedArticles)
        .filter(([key]) => key !== defaultData.ARTICLE_AUTHORS[-1])
        .map(([key, articles]) => [
          key,
          (((articles.length + 1) / (Object.values(this.data.articleRecommend.recommendedArticles).flat().length + Object.keys(this.data.articleRecommend.recommendedArticles).length - 1 || 1)).toFixed(2)),
        ])
    );  

    let totalAssignedArticles = 0;  
    const authorGenerateArticleCount = Object.fromEntries(
      Object.entries(
        Object.fromEntries(
          Object.entries(authorArticleCountRate).map(([key, rate]) => [
            key,
            Math.max(Math.round(rate * count), Math.floor(count * 0.2)), // 保证每个作者文章数不少于 20%
          ])
        )
      ).map(([key, count], i, arr) => {
        totalAssignedArticles += count;
        if (totalAssignedArticles > count) {
          const diff = totalAssignedArticles - count;
          if (i === 0) {
            return [key, count - diff];
          }
        }
        return [key, count];
      })
    );

    return authorGenerateArticleCount
  },

  /**
   * 给用户生成新文章，并添加在articleShowList中
   * @param {number} articleCount 除去碳行家文章数量
   */
  async getArticles(articleCount = 10){
    try {
      // 获取 infoGroup
      const infoGroup = this.data.articleRecommend.infoGroup;

      // 获取用户推荐文章标签
      const tags = this.getRecommendationTags(2);
      const subtags = this.getRecommendationSubTags(2);

      // 获取用户地理位置
      const geolocation = this.data.geolocation;

      // 获取用户已显示文章并排除
      const shownIDs = this.data.articleShowList.map(item => item._id);

      // 获取用户已读文章
      const readIDs = Object.values(
        this.data.articleRecommend.recommendedArticles
      ).flat();

      // 获取根据 author 数量动态分配对应数量文章的推荐
      const authorCountPair = this.getAuthorGenerateArticleCount(articleCount)

      // 普通文章推荐，并随机 shuffle 排序
      let normalArticles = []
      for (const [author, count] of Object.entries(authorCountPair)) {
        normalArticles = normalArticles.concat(
          (await this.fetchArticles({
            infoGroup: infoGroup,
            author: author,
            tags: tags,
            subtags: subtags,
            geolocation: geolocation,
            excludedIDs: shownIDs,
            readIDs: readIDs,
            count: count
          }))
        );
      }
      normalArticles.sort(() => Math.random() - 0.5)

      // 记录此次推荐
      await this.uploadUserRecommendHistory(normalArticles.map(item => item._id))

      // 添加新增文章到末尾
      const articles = this.data.articleShowList.concat(normalArticles);
      this.setData({
        articleShowList: articles
      });

      // 更新 UIArticleTags
      this.setData({ 
        UIArticleTags: [this.data.UIArticleTags[0], ...[...new Set(this.data.articleShowList.flatMap(a => (a.tags || []).filter(Boolean)))].sort()] 
      });      

      console.log("文章分配成功\n")
      // console.log(authorCountPair)
      // console.log(articles)
    } catch(error) {
      console.error("分配文章失败: ", error)
    }
  },

  /////////////////////////////////////////////////////////////////
  /////////////////// 界面交互 UI EVENT HANDLING ///////////////////
  /////////////////////////////////////////////////////////////////

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
    const url = `/pages/detail/detail?id=${articleID}&title=${title}&uploadTime=${uploadTime}&geolocation=${geolocation}&tags=${tags}&imgs=${imgs}&texts=${texts}`;

    // 导航到对应链接
    wx.navigateTo({
      url: url,
      success: () => {
        // 判断是否重复观看
        const isRepeated = Object.values(this.data.articleRecommend.recommendedArticles).flat().includes(articleID)

        // 更新文章 feature 分数
        this.updateTagFeatures(targetArticle.tags, targetArticle.subtags, isRepeated)

        // 如果未曾观看过，添加文章到已读列表
        if (!isRepeated) {
          this.data.articleRecommend.recommendedArticles[targetArticle.author].push(articleID)
        }

        // 上传数据
        this.uploadUserDataToCloud();
      }
    })
  },

  /**
   * UI 的自定义滚动触底事件
   */
  async onScrollToLower() {
    if (this.data.isLoading) return; // 防止多次触发
  
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载文章中...', mask: true });
  
    try {
      console.log('推荐新文章中...');
      await this.getArticles(10);
  
      // 更新 UI 标签（选择第一个'综合'标签）
      this.bindSelectUITag({
        currentTarget: {
          dataset: {
            tag: this.data.UIArticleTags[0]
          }
        }
      });
    } catch (e) {
      console.error('加载文章失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading()
      this.setData({ isLoading: false });
    }
  },

  ///////////////////////////////////////////////////////////////////////
  /////////////////// 功能函数 LOCAL FUNCTIONAL METHOD ///////////////////
  ///////////////////////////////////////////////////////////////////////

  /**
   * 初始化本页面数据
   */
  async initData() {
    this.setData({ isLoading: true });

    // 加载中显示
    wx.showLoading({ title: "文章加载中…", mask: true });
    const timeoutId = setTimeout(() => {
      wx.hideLoading(); // 最多10秒后关闭loading（保险）
    }, 10000);

    // 获取用户云端数据
    await this.fetchUserCloudFromData();

    // 检查版本更新
    await this.checkVersionUpdate();

    // 初始化“碳行家”文章
    const expertArticles = await this.fetchArticles({
      author: defaultData.ARTICLE_AUTHORS[-1]
    });
    this.setData({ articleShowList: expertArticles });

    // 初始化获取文章内置函数
    const finishArticleInit = async () => {
      await this.getArticles(10);
      this.bindSelectUITag({
        currentTarget: {
          dataset: {
            tag: this.data.UIArticleTags[0]
          }
        }
      });
      this.setData({ isLoading: false });
    };

    // 获取地理位置内置函数
    const getLocationWithTimeout = async (timeout = 5000) => {
      return await new Promise((resolve, reject) => {
        let isDone = false;
    
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            reject(new Error("getLocation timeout"));
          }
        }, timeout);
    
        wx.getLocation({
          type: "gcj02",
          success: res => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timer);
              resolve(res);
            }
          },
          fail: err => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timer);
              reject(err);
            }
          }
        });
      });
    };

    // 获取地理位置
    const setting = await wx.getSetting();
    const hasLocationPermission = setting.authSetting["scope.userLocationBackground"];
    if (hasLocationPermission) {
      try {
        const loc = await getLocationWithTimeout(10000);
        const latitude = loc.latitude.toFixed(2);
        const longitude = loc.longitude.toFixed(2);
      
        const { result: sendParams } = await wx.cloud.callFunction({
          name: "setweather",
          data: { longitude, latitude }
        }) || {};
      
        const rawProvince = sendParams.provinceName || "";
        const cleanedProvince = rawProvince.replace(/(省|市|区|县|自治区|特别行政区)$/, "");
        this.setData({ geolocation: cleanedProvince });
        console.log(`获取定位成功：${cleanedProvince}`);
      } catch (err) {
        console.warn("定位失败或超时：", err);
      } finally {
        await finishArticleInit();
        clearTimeout(timeoutId);
        wx.hideLoading();
      }
    
      return;
    }

    // 无定位权限，直接初始化文章
    await finishArticleInit();
    clearTimeout(timeoutId);
    wx.hideLoading();
  },


  ///////////////////////////////////////////////////////////////////////////
  /////////////////// 页面周期函数 PAGE BUILT-IN FUNCTIONS ///////////////////
  ///////////////////////////////////////////////////////////////////////////

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

    // 添加发钱 id 
    console.log('the u_openid is ',options.u_openid)
    this.setData({
      u_openid:options.u_openid
    })

    // 处理发钱事件
    if(options.u_openid){
      this.handleSendEntranceCash(options.u_openid)
    }

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

    // 提交用户log
    logEvent('Information Center')
    console.log('info page showing up')

    // 设置标题栏
    wx.setNavigationBarTitle({
      title: '碳行家｜信息中心'
    })
  },

  /////////////////////////////////////////////////////////////////
  /////////////////// 分享转发进入 PAGE SHARE IN ///////////////////
  /////////////////////////////////////////////////////////////////

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
  }
})