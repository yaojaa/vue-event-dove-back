const wx = require('../pay/wxpay/config').WxPayConfig;
const serverIP = '115.28.240.188';
exports.wxConfig = {
	serverIP            : serverIP,
	domainName			: "qa.www.eventdove.com",
	token               : "eventdove_token",
	encodingAESKey      : "tTFhWLqnwYLsRf39Xv7RrBKDbMAza5qwXenIwm00oFn",
	name                : "会鸽",
	appid               : wx.WX_APP_ID,
	secret				: wx.WX_APP_KEY,
	//测试号
	// "appid": "wxf320d582ab0e31bd",
	// "secret": "73af4c5ad49767ea43ca5ec54ed12ba7",
	replyText			: "终于等到你，还好我没放弃~.~",			//自动回复语
};

exports.wxPayConfig = {
	appid               : wx.WX_APP_ID,
	mchid          		: wx.WX_PARTNER_ID,
	partnerKey			: wx.WX_PARTNER_KEY,
	pfx					: wx.WX_APP_PFX,
	//notify_url			: 'http://qa.www.eventdove.com/api/wx/pay/notify',
	notify_url			: 'http://prgmjw.natappfree.cc/wxpay/notify',
	spbill_create_ip	: serverIP

};

