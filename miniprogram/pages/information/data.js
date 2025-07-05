export default {
  /** 文章推荐系统信息 */
  RECOMMENDATION_VERSION: '2.2.0', // 用来识别是否需要处理旧用户的 （Note: 请勿轻易更改，会去除用并重置户当前的articleRecommend信息）
  ARTICLE_COLLECTION: 'articles', // articles是实际用来用的， articlesTest是测试用的
  RECOMMENDATION_DATA_COLLECTION: 'articleRecommend',
  RECOMMENDATION_INFOGROUP_AMOUNT: 2,

  /** 前一天推荐参数修正 */ 
  DAILY_MULTIPLIER: 0.75,

  /** 文章推荐的权重和特征更新的步长 */
  RECOMMEND_FEATURES: {
    'articleCount': {    // 推荐该持有该标签文章的数量
      'UPDATESTEP': {
        'TAG': 1,
        'SUBTAG': 1,
      },
      'WEIGHT': 2.5,
      'NORMALIZED': false,
      'COUNT_REPEAT': false
    },

    'frequencyScore': {  // 用户点击该标签文章的频率快慢
      'UPDATESTEP': {
        'TAG': 0.2,
        'SUBTAG': 0.2,
      },
      'WEIGHT': 1.5,
      'NORMALIZED': true,
      'COUNT_REPEAT': true
    },
  },

  /** 文章作者索引 */
  ARTICLE_AUTHORS: {
    '-1': '碳行家',
    '0' : '个人版',
    '1' : '强国版'
  },

  /** 文章推荐分数权重 */
  ARTICLE_WEIGHT_SCORES: {
    'TAG': 5,
    'SUBTAG': 5,
    'GEOLOCATION': 2,
    'TIME': 3
  },

  /** 文章种类对应的 tags （这个会显示） */
  ARTICLE_TAGS: {
    '个人版': ['新能源汽车', '出行避雷攻略', '健康', '省钱'],
    '强国版': ['碳排放权交易', '生态环境部政策', '生态文明建设', '碳达峰']
  },

  /** 文章的副标签 subtags (这个不会显示) */
  ARTICLE_SUBTAGS: {
    '国家干预': ['国家干预', '非国家干预'],
    '时效': ['以前', '最近'],
    '正负': ['负面', '非负面']
  },

  /** 数据库存储 Key */
  RECOMMENDATION_DATA_KEYS: {
    RECOMMENDATION_VERSION: '-1',
    infoGroup: -1,
    features: {},
    recommendedArticles: {}
  }
}