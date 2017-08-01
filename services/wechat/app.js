/**
注册微信相关通知 中间件
@class 
@author :lwp
@date:  :2017-07-16
@version : 0.1.0 
**/

const wxConfig = require('./wechatConf').wxConfig;
const wxPayConfig = require('./wechatConf').wxPayConfig;
const wechat = require('wechat');
const config = {
    appid: wxConfig.appid,
    token: wxConfig.token,
    encodingAESKey: wxConfig.encodingAESKey
};
// const wechatPay = require('tenpay');
// const payApi = new wechatPay(wxPayConfig);
// const wxpayMiddleware = payApi.middlewareForExpress();
module.exports = function(app) {
	app.use('/wechat', wechat(config, function (req, res, next) {
	    const message = req.weixin;
	    req.body = message;
	    next();
	}));
	// app.use('/wx/pay/notify', wxpayMiddleware, function (req, res,next) {
	// 	const payInfo = req.weixin;
	// 	req.body = payInfo;
	// 	next();
	// });
}




