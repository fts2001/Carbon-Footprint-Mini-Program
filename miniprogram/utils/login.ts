const app = getApp();

/**
 * 更新当前页面的用户数据
 */
function updateUserData() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];

  if (app.globalData.userInfo) {
    currentPage.setData({
      openID: app.globalData.openID,
      userInfo: app.globalData.userInfo
    });
  }
}

/**
 * 检查用户是否登录
 * @param message 未登录的提醒登录的的信息标题，如果不填此项，则不会有弹窗消息
 * @param success 有账号的回调函数
 * @param fail 没有账号的回调函数
 * @returns 返回是否登录
 */
function onCheckSignIn({
    message,
    success, 
    failed, 
  }: { 
    message?: string,
    success?: () => void | Promise<void>, 
    failed?: () => void | Promise<void>, 
  } = {}) : boolean {
    if (app.globalData.userInfo) {
      if (success) success();
      return true;
    } else {
      if (message) {
        wx.showModal({
          title: message,
          content: '未注册用户将只能体验小程序部分功能，点击确定按钮注册以获得完整体验',
          success: (res) =>{
            if(res.confirm){
              wx.reLaunch({
                url:'/pages/index/index'
              })
            }
          }
        })
      }
      if (failed) failed();
      return false;
    }
}

/**
 * 为用户进行登录账号
 * @param success 成功登录的回调函数
 * @param fail 登录失败的回调函数
 * @param error 发生错误的回调函数
 * @returns 返回是否成功登录
 */
async function onHandleSignIn({
    success, 
    failed, 
    error 
  }: { 
    success?: () => void | Promise<void>, 
    failed?: () => void | Promise<void>, 
    error?: () => void | Promise<void> 
  } = {}) : Promise<boolean> {
  // 当前已登录则无需访问数据库
  if (app.globalData.userInfo) {
    if (success) success();
    return true;
  } else {
    const db = wx.cloud.database();
    try {
      // 尝试获取账号
      const res = await wx.cloud.callFunction({ name: 'login' });
      const openID = (res.result as { data?: any }).data._openid;
      const userInfoQuery = await db.collection('userInfo')
        .where({ _openid: openID })
        .get();

      // 成功获取账号
      if (userInfoQuery.data.length === 1) {
        app.globalData.userInfo = userInfoQuery.data[0];
        app.globalData.openID = openID;
        if (success) success();
        return true;

      // 用户未注册账号
      } else if (userInfoQuery.data.length === 0) {
        if (failed) failed();
        return false;

      // 用户错误拥有多个账号
      } else {
        if (error) error();
        return false;
      }

      // 报错情况
    } catch(err) {
      if (error) {
        error();
      } else {
        console.log(err);
      }
      return false;
    }
  }
}

export { updateUserData, onCheckSignIn, onHandleSignIn }