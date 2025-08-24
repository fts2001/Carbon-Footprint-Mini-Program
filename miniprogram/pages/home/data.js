export default {
  // Page Settings
  exportQuestion: [
    {
      question: "1.	您知道本小程序是完全匿名，且未收集未关联类似微信号，手机号等个人隐私信息吗？",
      answer: ["知道", "不知道", "不好说", "不想回答"]
    },
    {
      question: "2.	您是否曾经拒绝过其它小程序或者APP的数据权限请求吗（比如手机号，位置信息，人脸信息等）？",
      answer: ["经常拒绝", "偶尔拒绝", "从来没有", "不知道或者说不清"]
    },
    {
      question: "3.	您在使用本应用时选择了允许访问您的定位信息。请问您当时做出该选择的主要考虑是什么？",
      answer: [
        "我相信这个小程序的功能需要定位信息",
        "我觉得这个数据用途合理，目的是环保",
        "我习惯于授予类似权限，觉得没什么问题",
        "我认为自己可以随时关闭定位，不担心"
      ],
      otherAnswer: "其他（请注明）",
      showFlag: "location_1"
    },
    {
      question: "3.	您在使用本应用时选择了拒绝访问您的定位信息。请问您当时做出该选择的主要考虑是什么？",
      answer: ["我担心定位信息被泄露或被滥用", "我不确定这个小程序是否安全可信", "我觉得功能不值得提供个人隐私", "我一向避免分享定位信息"],
      otherAnswer: "其他（请注明）",
      showFlag: "location_0"
    },
    {
      question:
        "4.	公安部、国家互联网信息办公室等六部门联合公布《国家网络身份认证公共服务管理办法》帮助您获取网络身份认证，实现数据共享。您如果需要可通过下载国家网络身份认证APP领取（见此文https://www.cac.gov.cn/2025-05/23/c_1749711107835487.htm）。该认证可为公民提供可信的数字身份认证服务。您听说过这个认证吗？",
      answer: ["听说过", "没听说", "不好说", "不想回答"]
    },
    {
      question:
        "5.	利用该数字身份认证在不同部门之间共享公民个人数据（如行政检查、公安、税务）有助于提升效率，但也可能涉及公民的个人隐私。对以下观点您最赞同的是",
      answer: [
        "我支持有关部门共享数据，这样可以避免数据管理混乱带来的个人网络隐私信息风险",
        "在确保个人信息脱敏后，在各部门之间共享数据以提高公共服务效率",
        "如果明确在共享前完全删除身份证号、手机号等敏感信息，我愿意提供数据支持此类共享",
        "所有数据均需用户单独授权后才能共享",
        "即使数据被脱敏，我还是担心部门间共享我的个人信息可能会被滥用",
        "	比起公共服务以外的目的，我更担心有关部门不当收集隐私信息",
        "不知道或者说不清"
      ]
    }
  ],
  colorStyle: null,
  background: null,
  isFromShareTimeline: true,

  show: false,
  showPurposes: false,
  mysaving: 0,
  myranking: "未上榜",
  testGroup: null,
  users: [],
  recordStatus: false,
  btnClass: "btn btn-default",
  todayRecordList: [],
  isRecordEmpty: true,
  userInfo: null,
  // Temporary record information
  startTime: 0,
  endTime: 0,
  duration: 0,
  startNowTime: "",
  // User data
  brand: "",
  model: "",
  system: "", //Phone OS
  version: "", //WeChat version
  platform: "",
  curID: "",
  purpose: [],
  transport: [],
  updating: false,
  transportList: ["步行或骑行", "公共交通", "电动汽车", "燃油汽车"],
  // purposes: [
  //   {
  //     value: "通勤",
  //     name: "通勤"
  //   },
  //   {
  //     value: "休闲娱乐",
  //     name: "休闲娱乐"
  //   },
  //   {
  //     value: "医疗健康",
  //     name: "医疗健康"
  //   },
  //   {
  //     value: "旅游",
  //     name: "旅游"
  //   },
  //   {
  //     value: "其他",
  //     name: "其他"
  //   }
  // ],
  endTransportList: [
    {
      value: "步行",
      name: "步行"
    },
    {
      value: "自行车(共享单车)",
      name: "自行车(共享单车)"
    },
    {
      value: "电动自行车",
      name: "电动自行车"
    },
    {
      value: "公交车",
      name: "公交车"
    },
    {
      value: "驾驶/乘坐燃油汽车",
      name: "驾驶/乘坐燃油汽车"
    },
    {
      value: "驾驶/乘坐电动汽车",
      name: "驾驶/乘坐电动汽车"
    },
    {
      value: "地铁",
      name: "地铁"
    },
    {
      value: "高铁",
      name: "高铁"
    }
  ],
  index: 0,
  endIndex: 0,
  defaultIndex: 0,
  capacity: 0,
  capacityList: ["1", "2", "3", "4", "5+"],
  // isFront: true,
  aqi: "",
  name: "",
  category: "",
  transporModalHidden: true,
  // capacityModalHidden: true,
  speedBetween: [
    {
      label: "步行/跑步",
      min: 0,
      max: 2.78
    },
    {
      label: "骑行",
      min: 2.78,
      max: 5.56
    },
    {
      label: "汽车(市区)",
      min: 5.56,
      max: 13.89
    },
    {
      label: "汽车(高速公路)",
      min: 22.22,
      max: 33.33
    },
    {
      label: "公交车（市区）",
      min: 4.17,
      max: 8.33
    },
    {
      label: "公交车（长途）",
      min: 16.67,
      max: 25
    },
    {
      label: "地铁",
      min: 8.33,
      max: 16.67
    },
    {
      label: "高铁",
      min: 55.56,
      max: 111.11
    }
  ],

  schedules: [
    { label: "步行", color: "walk", totalTime: 0 },
    { label: "骑行", color: "cycling", totalTime: 0 },
    { label: "开车", color: "drive", totalTime: 0 },
    { label: "公交", color: "bus", totalTime: 0 },
    { label: "地铁", color: "subway", totalTime: 0 },
    { label: "高铁", color: "train", totalTime: 0 }
  ],
  showSchedules: [],
  showPoint: false,
  lastTrack: null,

  // data attribute for new UI starts here

  activeTab: "trip",
  isTracking: false,

  activeTransportation: "",
  transportations: [
    {
      label: "步行",
      icon: "../../asset/img/walking.svg"
    },
    {
      label: "自行车(共享单车)",
      icon: "../../asset/img/bike.svg"
    },
    {
      label: "电动自行车",
      icon: "../../asset/img/bike1.svg"
    },
    {
      label: "公交车",
      icon: "../../asset/img/bus.svg"
    },
    {
      label: "燃油汽车",
      icon: "../../asset/img/car.svg"
    },
    {
      label: "电动汽车",
      icon: "../../asset/img/electricCar.svg"
    },
    {
      label: "地铁",
      icon: "../../asset/img/subway.svg"
    },
    {
      label: "高铁",
      icon: "../../asset/img/train.svg"
    }
  ],
  purposes: [
    {
      label: "去上班",
      icon: "../../asset/img/work.svg"
    },
    {
      label: "休闲娱乐",
      icon: "../../asset/img/cinema.svg"
    },
    {
      label: "回家",
      icon: "../../asset/img/house.svg"
    },
    {
      label: "购物",
      icon: "../../asset/img/groceryCart.svg"
    },
    {
      label: "跑腿类杂事",
      icon: "../../asset/img/runningErrands.svg"
    },
    {
      label: "其他",
      icon: "../../asset/img/other.svg"
    }
  ],
  //   todayRecordList : [
  //     {
  //         transport: "公交",
  //         endTime: Date.now(),
  //         date: Date.now() - 45 * 60 * 1000, // 45 minutes ago
  //         carbSum: 15,
  //         purpose: "购物",
  //     },
  //     {
  //         transport: "步行",
  //         endTime: Date.now(),
  //         date: Date.now() - 120 * 60 * 1000, // 2 hours ago
  //         carbSum: 30,
  //         purpose: "出差",
  //     },
  //     {
  //         transport: "开车",
  //         endTime: Date.now(),
  //         date: Date.now() - 180 * 60 * 1000, // 3 hours ago
  //         carbSum: 50,
  //         purpose: "旅游",
  //     }
  // ]
  prizeModalShow: false,
  activityModalShow: false,
  scoreModalShow: false,
  showTimer: ""
};
