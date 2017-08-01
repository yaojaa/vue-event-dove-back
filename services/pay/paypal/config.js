/**
 * Created by Henry on 2017/3/29.
 */

const PayPalConfig = {
    userId            : 'caiwu_api1.eventown.com',
    password          : 'X6DQR95K3FBXH84K',
    signature         : 'AiPC9BjkCyDFQXbSkoZcgqH3hpacAbKD3y1qDRWNY2mCY1Kyo2lJrcDO',
    appId             : 'APP-37189947AY821784L',
    sandbox           : false,
    receiver          : 'caiwu_api1.eventown.com',
    ipnNotificationUrl: 'https://www.eventdove.com/pay/payPalNotify',
    returnUrl         : 'https://www.eventdove.com/pay/payPalReturn',
    cancelUrl         : 'https://www.eventdove.com/pay/payPalCancel',
};

const PayPalSandboxConfig = {
    userId            : 'caiwu-facilitator_api1.eventown.com',
    password          : 'CE7YK4YHCQNKD2S3',
    signature         : 'AFcWxV21C7fd0v3bYYYRCpSSRl31AFAXLVmzIOsTjQsXyu7C6AZapEmk',
    appId : 'APP-80W284485P519543T',
    sandbox           : true,
    receiver          : 'caiwu-facilitator@eventown.com',
    ipnNotificationUrl: 'https://paytest.s1.natapp.cc/pay/payPalNotify',
    returnUrl         : 'https://paytest.s1.natapp.cc/pay/payPalReturn',
    cancelUrl         : 'https://paytest.s1.natapp.cc/pay/payPalCancel',
};

if ('production' === process.env.NODE_ENV) {
    exports.PayPalConfig = PayPalConfig;
} else {
    exports.PayPalConfig = PayPalSandboxConfig;
}
