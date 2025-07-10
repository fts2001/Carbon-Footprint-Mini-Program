interface TransferResult {
  errMsg: string;
  result?: {
    error?: {
      code: string;
      message: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

const mchid = '1680661471'; // merchant ID

/**
 * Transfers money to a specified user.
 * @param money Amount of money to transfer.
 * @param remark Remark for the transfer to appear on client side 
 * @param _openid OpenID of the recipient.
 * @param success Callback function for successful transfer.
 * @param fail Callback function for failed transfer.
 * @param error Callback function for error during transfer.
 * @returns Returns a Promise resolving to the result of the transfer.
 */
async function transfer({
  money, 
  remark,
  _openid, 
  success, 
  failed, 
  error 
}: { 
  money: number; 
  remark: string;
  _openid: string; 
  success?: (result: any) => void | Promise<void>; 
  failed?: (error: any) => void | Promise<void>; 
  error?: (err: any) => void | Promise<void>; 
}): Promise<any> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'transfer',
      data: { money, remark, _openid },
    }) as TransferResult;
    // console.log(result)
    if (result.errMsg === "cloud.callFunction:ok") {
      const { result: functionResult } = result;
      // console.log(functionResult);
      if (functionResult && !functionResult.error) {
        // 成功发放
        console.log(result.result?.package_info)
        if (wx.canIUse('requestMerchantTransfer')) {
          wx.requestMerchantTransfer({
            mchId: mchid,
            appId: wx.getAccountInfoSync().miniProgram.appId,
            package: result.result?.package_info,
            success: (res) => {
              if (success) success(res);
            },
            fail: (res) => {
              if (failed) failed(res)
            },
          });
        } else {
          if (failed) failed('你的微信版本过低，请更新至最新版本。')
        }
      }
    } else {
      if (failed) failed(result.errMsg);
    }

    return result.result;
  } catch (err) {
    if (error) {
      error(err);
    } else {
      console.log(err);
    }
    throw err;
  }
}

export { transfer };
