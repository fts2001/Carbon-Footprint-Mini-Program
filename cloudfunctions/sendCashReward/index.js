// Import the required modules
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const axios = require('axios');

cloud.init();

function hexMD5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

exports.main = async (event, context) => {
  const { type, money } = event;

  const apikey = 'carbclever';
  const uid = '10815051';

  try {
    // Step 1: 先获取可用的前端授权域名
    console.log('Step 1: 获取前端授权域名');
    const domainUrl = `https://www.yaoyaola.net/exapi/get_authdomain/${uid}`;
    const domainResponse = await axios.get(domainUrl);
    console.log('Domain response:', domainResponse.data);

    if (domainResponse.data.errcode !== '0' || !domainResponse.data.domain) {
      return {
        success: false,
        message: 'Failed to get auth domain: ' + (domainResponse.data.errmsg || 'Unknown error')
      };
    }

    const frontendDomain = domainResponse.data.domain;
    console.log('Got frontend domain:', frontendDomain);

    // Step 2: 创建红包ticket
    console.log('Step 2: 创建红包ticket');
    const orderid = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const reqtick = Math.floor(Date.now() / 1000);
    const sig = hexMD5(`${uid}${type}${orderid}${money}${reqtick}${apikey}`);

    const queryParams = new URLSearchParams({
      uid,
      type,
      orderid,
      money,
      reqtick,
      expire: 3600,
      sign: sig,
      title: '现金发奖',
      sendname: '碳行家',
      wishing: '心想事成'
    }).toString();

    const ticketUrl = `https://www.yaoyaola.net/exapi/hbticket?${queryParams}`;
    console.log('Creating ticket with URL:', ticketUrl);

    const ticketResponse = await axios.get(ticketUrl);
    console.log('Ticket response:', ticketResponse.data);

    if (ticketResponse.data.errcode === '0' && ticketResponse.data.ticket) {
      return {
        success: true,
        ticket: ticketResponse.data.ticket,
        domain: frontendDomain,  // 返回前端域名
        orderid: orderid,
        message: 'Ticket created successfully'
      };
    } else {
      return {
        success: false,
        message: ticketResponse.data.errmsg || 'Failed to create ticket'
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};
