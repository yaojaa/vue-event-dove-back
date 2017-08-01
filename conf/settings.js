exports.rethinkdbHost = 'localhost';
exports.rethinkdbPort = 28015;
exports.rethinkdbDB   = 'eventdove';
// exports.rethinkdbUser   = "admin";
// exports.rethinkdbPasswd = "evedatacenterT#%&.181";

// sendCloud API URL
exports.sendCloudApiUrl  = {
    apiUser     : "eventown",
    apiKey      : "DPK8iOR2hkkg4JKj",
    apiUrl      : "http://api.sendcloud.net/apiv2/",         // url
    email       : "mail/",                                   // 邮件模块
    publicSend  : "send",                                    // 普通发送
    templateSend: "sendtemplate"                             // 模板
};
exports.port             = 9000;
exports.httpsPort        = 9001;
exports.serverUrl        = 'http://qa.www.eventdove.com';// 会鸽项目前台访问地址
exports.serverApiUrl     = 'http://qa.www.eventdove.com/api';// 会鸽项目api地址
exports.secret           = 'iloveventdove';
exports.sessionExpiresIn = 60 * 60 * 24; // seconds
exports.localeCookieName = 'locale';
exports.datacenterId     = 1;
exports.serverId         = 1;
exports.DATA_DIR         = 'refdata/';

exports.CACHE_FLAG  = true;
exports.redisConfig = {
    HOST: 'localhost',
    PORT: 35050,
    OPTS: {}
};

exports.RabbitMQConfig = {
    connUrl: 'amqp://localhost:5672',
    OPTS   : {}
};

// 新浪微博第三方登录
exports.sina_weibo_appKey    = '3449170722';
exports.sina_weibo_appSecret = '4f5da80aa007cfc0c75345b36c2907bf';

// qq第三方登录
exports.qq_appKey    = '101408486';
exports.qq_appSecret = '2a634a5bd63e1467504edb1814edef8f';

// 微信第三方登录
exports.wx_appKey    = 'wx624f0b4dd7b7e36c';
exports.wx_appSecret = 'b8dbd086afb72f11a37c7d3a874549c3';

// 7牛的access信息，用于文件上传
exports.qiniu = {
    'uploadUrl': 'http://upload.qiniu.com',
    'accessKey': 'o-JFl4T8wh525DaNX8zaPtZ6Cpc-EKpJBnUI0JpF',
    'secretKey': '_5ayhfvc2uRQ7MM_b5DBRxJ_k1qP4T__USz83ZNh',
    'bucket'   : 'eventdove',
    'domain'   : 'okxpbi18m.bkt.clouddn.com'
};

// 日志的设置
exports.logger = {
    categoryName: 'EventDove',// 日志分类的名字
    level       : 'debug',// 日志记录级别
};

// 测试使用的万能验证码
exports.testVerify = {
    verificationCode: 'rdDHyxDppGtr7l6d',// 手机号验证码
    captcha         : '<q3YtZUJqk.w_/{',// 图片验证码
};

// 以下将使用本地的配置来替换上面的配置
const fs             = require('fs');
const fn             = __dirname + "/local_settings.json";
const local_settings = JSON.parse(fs.readFileSync(fn));

for (let attrName in local_settings) {
    exports[attrName] = local_settings[attrName];
}

if (process.env.NODE_ENV == "test") {
    exports.rethinkdbHost = 'localhost';
    exports.rethinkdbPort = 28015;
    exports.rethinkdbDB   = 'testdb';

    if (!process.env.RDB_SECURED) {
        exports.rethinkdbUser   = 'admin';
        exports.rethinkdbPasswd = '';
    }
}

// 手机号 邮箱 验证 正则
exports.sms_regx   = /^1(3|4|5|7|8)\d{9}$/;
exports.email_regx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;

// 会鸽项目前台的各个访问地址
exports.eventdoveUrl = {
    templateSettings: {
        interpolate: /{{([\s\S]+?)}}/g,
    },
    eventUrl        : exports.serverUrl + '/site/{{eventId}}',// 活动链接地址
    ticketUrl       : exports.serverUrl + '/electronicTicket/{{attendeeId}}/{{orderNumber}}',// 查看门票详情的地址
    mail_activation : exports.serverUrl + '/user/mail_activation?token={{token}}',// 邮件激活
    reset_pwd       : exports.serverUrl + '/user/reset_pwd?token={{token}}',// 重置密码
    orderPayUrl     : exports.serverUrl + '/paySelecte/{{orderId}}/{{eventId}}', //订单支持地址

};

console.log('-------------------------------------载入配置信息-------------------------------------');
console.log(exports);
console.log('-------------------------------------载入配置信息-------------------------------------');
