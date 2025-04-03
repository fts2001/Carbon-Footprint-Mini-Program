// function to send cash to user using wechatpay api v3




// 

//input params：


// _openid : unique identifier of user
// money: the amount of money to send out, unit : cent
// batch_name: the name appears on the client side of this transaction
// batch_remark: the name appears on server side of this transaction  , same as transfer remark


// 


const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize cloud
cloud.init();

const appid = 'wx501c20d4e2802733'; 
const mchid = '1680661471'; // merchant ID
const serialNumber='14AD194FC3E19D5A880016589136D98B48A6B5BB'; // WeChat Pay serial number
const api_key = 'CarbonCleverDukeKunshanCHANGLAB3'

exports.main = async (event, context) => {
  const { money, _openid, batch_name, batch_remark,transfer_remark} = event;

  // Initialize WechatPay
  const wechatPayInstance = new WechatPay({
    appid: appid,
    mchid: mchid,
    publicKey: fs.readFileSync('./platform_certificate.pem'),  // 平台公钥
    privateKey: fs.readFileSync('./apiclient_key.pem'), // 签名私钥
    serial_no:'14AD194FC3E19D5A880016589136D98B48A6B5BB',
    key:'CarbonCleverDukeKunshanCHANGLAB3'
  });

  const payload = {
    appid: appid,
    out_bill_no: `bill${Date.now()}`,
    transfer_scene_id: '1000',
    openid: _openid,
    transfer_amount: money,
    transfer_remark: transfer_remark,
    transfer_scene_report_infos: [{
      info_type: "活动名称",
      info_content: "注册现金奖励"
    },{
      info_type: "奖励说明",
      info_content: `注册奖励现金${money / 100}元`
    }]
  };

  const body = payload;
  const nonce_str = Math.random().toString(36).substr(2, 15);
  const timestamp = parseInt(+new Date() / 1000 + '').toString();
  // const url = '/v3/transfer/batches'; // old API
  const url = '/v3/fund-app/mch-transfer/transfer-bills';
  // const cert_url = '/v3/certificates'
  // // 获取签名
  const signature = wechatPayInstance.getSignature('POST', nonce_str,timestamp, url, body);

  // 获取头部authorization 参数
  const authorization = wechatPayInstance.getAuthorization(nonce_str, timestamp, signature);

  console.log(signature)
  try {
    const response = await axios.post(`https://api.mch.weixin.qq.com${url}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Wechatpay-Serial':'4A85BE9F075D1F920E86899D7E9F2D42F4B017F1'
      },
    });

    return response.data;
  } catch (error) {
    return {
      error: error.response ? error.response.data : error.message
    };
  }
};
