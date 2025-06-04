export default {
  // Page Settings
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
  ]

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
};
