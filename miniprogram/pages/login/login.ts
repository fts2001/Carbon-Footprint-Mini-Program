// pages/login/login.ts
export{}
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: defaultAvatarUrl,
    region: null,
    carSelected: false,
    _id: null,
    openID: null,
    userInfo: null,
    dobarr: ["18-23岁","24-29岁","30-39岁","40-49岁","50-59","60岁及以上"],
    occupationArr: ["学生","事业单位工作人员","党政机关工作人员", "国有企业员工", "外资企业雇员", "民营企业雇员", "私企或个体经营户", "体力工人", "自由职业者", "商业，服务从业者","退休"],
    gradArr: ["小学以下", "小学", "初中", "高中", "职高/中专", "大专", "大学", "硕士", "博士"],
    transArr: ["飞机","铁路","城际巴士","自驾","顺风车"],
    car:null,
    occu: null,
    grad: null,
    trans:null,
    dob: null,
    email:'',
    nickname:null,
    info: '',
    sex: [
      { name: '0', value: '男', checked: 'true' },
      { name: '1', value: '女' },
      {name:'2', value:'保密'}
    ],
    choice: [
      { name: '0', value: '是', checked: 'true' },
      { name: '1', value: '否' }
    ],
    isSex: "0",
    information: [],
    userSex: '',
    modalHidden: false

  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  },
  modalConfirm(e){
    this.setData({
      modalHidden:true
    })
  },
  modalCancel(){
    wx.navigateBack({
      delta: 1
    })
  },
  //单选按钮发生变化
  radioChange(e) {
    console.log(e.detail.value);
    var sexName = this.data.isSex
    this.setData({
      isSex: e.detail.value
    })
  },

  bindgradChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      grad: e.detail.value
    })
  },
  bindcarChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      car: e.detail.value
    })
  },
  bindtransChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      trans: e.detail.value
    })
    if (e.detail.value==2) {
      this.setData({
        carSelected: true
      })
    }else{this.setData({
      carSelected: false
    })}
  },
  bindOccuChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      occu: e.detail.value
    })
  },
  bindDobChange: function (e) {
    console.log(e.detail.value)
    this.setData({
      dob: e.detail.value
    })
  },
  bindRegionChange:function(e){
    console.log(e.detail.value)
    this.setData({
      region: e.detail.value
    })
  },
  bindemailchange: function(e){
    console.log(e.detail.value)
    this.setData({
      email:e.detail.value
    })
  },
  bindnamechange: function(e){
    console.log(e.detail.value)
    this.setData({
      nickname: e.detail.value
    })
  },
 
  //表单提交
  // 检验
  checkSubmit(){
    var email = this.data.email;
    var nickname = this.data.nickname;
    var region = this.data.region;
    var dob= this.data.dob;
    var occu = this.data.occu;
    var grad = this.data.grad;
    var trans = this.data.trans;
    var avatar = this.data.avatarUrl
    // var reg1 =  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    console.log(nickname)
    if(avatar == defaultAvatarUrl){
      wx.showToast({
        title: '头像未选择',
        icon: 'error'
      })
    }
    if(nickname == null){
      wx.showToast({
        title:"昵称未填写",
        icon:"error"
      })
      return 1 
    }
    // if(dob == null){
    //   wx.showToast({
    //     title: '年龄未填写',
    //     icon:"error"
    //   })
    //   return 1
    // }
    // if(occu == null){
    //   wx.showToast({
    //     title: '职业未填写',
    //     icon:"error"
    //   })
    //   return 1
    // }
    // if(grad == null){
    //   wx.showToast({
    //     title: '学历未填写',
    //     icon:"error"
    //   })
    //   return 1
    // }
    if(region==null){
      wx.showToast({
        title: '始发地未填写',
        icon:'error'
      })
      return 1
    }
    if(trans==null){
      wx.showToast({
        title: '来程交通方式未填写',
        icon:"error"
      })
      return 1
    }
    // if (email!='') {
    //   if(reg1.test(email)==false){
    //     console.log('邮箱格式错误，请检查');
    //     wx.showToast({
    //       title: "邮箱格式错误",
    //       icon: "error",
    //       duration: 2000,
    //       mask: true,
    //     })
    //     this.setData({
    //       email:''
    //     })
    //     return 1;
    //   }
    // }
    return 2 
  },
  login(e:any) {
     
    console.log(e.detail.value)
    var _this = this
    var checkResult = _this.checkSubmit();
    
    if (checkResult == 2) {
      console.log(_this.data.openID);
      const db = wx.cloud.database();
      const _ = db.command;
      const avatar = _this.data.avatarUrl;
    
      // 显示数据更新中的提示
      wx.showToast({
        title: '数据更新中',
        icon: 'loading',
        duration: 10000, // 设置持续显示时间，单位毫秒，可根据实际上传时间调整
        mask: true,
      });
    
      wx.cloud.uploadFile({
        cloudPath: 'avatar/' + new Date().getTime() + '.jpeg',
        filePath: avatar,
        success: async (res) => {
          console.log('成功上传');
          console.log(res.fileID);
          const path = res.fileID;
          const timestamp = new Date();
          // const userGroup = Math.floor(Math.random() * 3) + 1;
          const userGroup = 2
          const basicInfo = e.detail.value;
          await db.collection('lottery').add({
            data:{
              credit:20,
              prizes:[],
              claimedprizes: [],
              attempts:0
            }
          })
          await db.collection('userInfo').add({
            data:{
              testGroup: userGroup,
              avatar: path,
              basicInfo: basicInfo,
              loginDate: timestamp,
              carbSum: 0,
              // todo: minimize the schema of this collection
            }
          })
          try {
            // 上传完成后，从userInfo中获取用户信息
            const userInfoData = {
              testGroup: userGroup,
              avatar: path,
              basicInfo: basicInfo,
              loginDate: timestamp,
              carbSum: 0,
              // todo: minimize the schema of this collection
            };
            if (userInfoData) {
              // 更新 app.globalData.userInfo
              app.globalData.userInfo = userInfoData;
              // 隐藏数据更新中的提示
              wx.hideToast();
              // 显示提交成功的提示
              wx.showToast({
                title: '提交成功',
                icon: 'success',
                duration: 2000,
                mask: true,
              });
    
              // 延时跳转到指定页面
              wx.switchTab({
                  url:'/pages/center/center'
                })
              ;
            } else {
              // 如果找不到用户信息，显示错误提示
              wx.hideToast();
              wx.showToast({
                title: '未找到用户信息',
                icon: 'none',
                duration: 2000,
                mask: true,
              });
            }
          } catch (error) {
            // 处理获取用户信息失败的情况
            wx.hideToast();
            wx.showToast({
              title: '获取用户信息失败',
              icon: 'none',
              duration: 2000,
              mask: true,
            });
            console.error('获取用户信息失败', error);
          }
        },
        fail: (error) => {
          // 处理上传失败的情况
          wx.hideToast(); // 隐藏数据更新中的提示
          wx.showToast({
            title: '上传失败',
            icon: 'none',
            duration: 2000,
            mask: true,
          });
          console.error('上传失败', error);
        }
      });
    }
    
    

  },
  onReady:function(){

  },
  
  
  onLoad() {
  },
})
