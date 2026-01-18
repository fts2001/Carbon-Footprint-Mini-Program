Page({
    data: {
        redPacketUrl: ''
    },

    onLoad(options) {
        if (options.url) {
            const url = decodeURIComponent(options.url);
            console.log('[红包页面] 加载红包领取链接:', url);
            this.setData({
                redPacketUrl: url
            });
        }
    },

    onShow() {
        console.log('[红包页面] 页面显示');
    },

    // 用户返回时的处理
    onUnload() {
        console.log('[红包页面] 页面卸载，返回登录页');
    }
});
