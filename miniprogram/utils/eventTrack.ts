class EventTrack {
  logEvent(eventName: string, params?: Record<string, any>) {
    console.log("[--- 数据埋点 ---]", eventName, params);
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: "eventTrack",
        data: { eventName, params },
        success: (res: any) => {
          resolve(true);
          console.log("[--- 数据埋点 ---] log event successfully:", res);
        },
        fail: (err: any) => {
          console.error("[--- 数据埋点 ---] Error calling cloud function:", err);
          reject(err);
        }
      });
    });
  }
}

export const eventTrack = new EventTrack();

export enum EventNames {
  ENTER_INFORMATION_CENTER = "enter_information_center", //进入信息中心
  CLICK_ARTICLE_ITEM = "click_article_item", //点击文章 时间和哪篇文章
  EXIT_ARTICLE_ITEM = "exit_article_item", // 退出文章 时间和哪篇文章
  SCROLL_ARTICLE = "scroll_article", // 滚动文章的次数 和滚动位置
  ENTER_HOME = "enter_home", // 进入首页/省碳页
  TRACK_DATA = "track_data", // 省碳记录的数据
  NEW_USER_SIGN_UP = "new_user_sign_up", // 新用户注册
  NEW_USER_88_MODAL = "new_user_88_modal", // 新用户88广告弹窗
  ENTER_NOTIFICATION = "enter_notification", // 进入知情通知的时间
  AGREE_NOTIFICATION = "agree_notification", // 同意知情通知
  REJECT_NOTIFICATION = "reject_notification", // 拒绝知情通知
  USER_LOGIN_FINISH = "user_login_finish", // 用户提交注册表单
  USER_LOGIN_TYPE = "user_login_type", // 用户分组/分类
  USER_AUTHORIZES = "user_authorizes", // 用户授权了哪些权限
  CLOSE_MODAL = "close_modal", // 关闭了广告弹窗
  ENTER_LOADING_PAGE = "enter_loading_page" // 进入加载页
}
