/**
 * Created by zhaohongyu on 2017/3/6.
 */
const fs = require('fs');

// // 南京海震微信帐号配置
// const WxPayConfig = {
//     WX_NOTIFY_URL: 'http://qa.www.eventdove.com/api/wxpay/notify',// todo 临时测试地址,上线需要修改
//     WX_APP_ID    : 'wxcafdbc6d954eaa44',
//     WX_APP_KEY   : '16f6f1134efdcb6280ca620ff48ebcd5',
//     WX_PARTNER_ID : '1220262701',
//     WX_PARTNER_KEY: 'a3b347f2c91bd88f456df73a57839d9c',// 微信商户平台API密钥
//     WX_APP_PFX   : fs.readFileSync('./services/pay/wxpay/eventdove_apiclient_cert.p12'),// 微信商户平台证书
// };

// 会唐世纪微信帐号配置
const WxPayConfig = {
    WX_NOTIFY_URL		: 'http://qa.www.eventdove.com/api/wxpay/notify',// todo 临时测试地址,上线需要修改
    WX_APP_ID    		: 'wxd71d6c492b7a454c',// AppID
    WX_APP_KEY   		: '4966237074bb12c838af12b792776553',// AppSecret
    WX_PARTNER_ID 		: '1485894232',// 商户id
    WX_PARTNER_KEY		: 'eventdovesfsWvwWEOLP90sfsdpmk821',// 微信商户平台API密钥
    WX_APP_PFX   		: fs.readFileSync('./services/pay/wxpay/eventown_apiclient_cert.p12'),// 微信商户平台证书
};

exports.WxPayConfig = WxPayConfig;