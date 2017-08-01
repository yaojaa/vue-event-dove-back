// 支付货币
const CURRENCY_NAME = {
    DOLLAR: "dollar",   // 美元
    YUAN  : "yuan",     // 人民币
    TIAO  : "tiao"      // 条
};

// 支付货币标识
const PAYMENT_PRICE_UNIT_SIGN = {
    PAYMENT_PRICE_UNIT_SIGN_DOLLAR: "$",      // 美元符号
    PAYMENT_PRICE_UNIT_SIGN_YUAN  : "￥"      // 人民币符号
};

// 收付款平台
const RECEIVING_PLAT_FORM = {
    RECEIVING_PLAT_FORM_ALIPAY: "alipay",       // 支付宝
    RECEIVING_PLAT_FORM_PAYPAL: "paypal",       // 贝宝
    RECEIVING_PLAT_FORM_WECHAT: "wechat"        // 微信
};

// 资金账户状态
const USER_ACCOUNT_STATE = {
    USER_ACCOUNT_STATE_NONE  : "none",      // 不冻结
    USER_ACCOUNT_STATE_ALL   : "all",       // 冻结所有
    USER_ACCOUNT_STATE_YUAN  : "yuan",      // 冻结人民币帐户
    USER_ACCOUNT_STATE_DOLLAR: "dollar"     // 冻结美元帐户
};

// 订单购买平台
const ORDER_PLATFORM = {
    ORDER_PLATFORM_WEB    : "web",          // web
    ORDER_PLATFORM_ANDROID: "android",      // android
    ORDER_PLATFORM_IOS    : "iphone",       // iphone
    ORDER_PLATFORM_WECHAT : "wechat",       // 微信
    ORDER_PLATFORM_ONSITE : "onsite",       // 现场
    ORDER_PLATFORM_UPLOAD : "upload",       // 上传
    ORDER_PLATFORM_ADMIN  : "admin",        // 活动管理员
};

// 提现状态
const TAKE_CASH_STATE = {
    TAKE_CASH_STATE_NONE   : "none",        // 未受理
    TAKE_CASH_STATE_ACCEPT : "accept",      // 已受理
    TAKE_CASH_STATE_IN     : "in",          // 转账中
    TAKE_CASH_STATE_SUCCESS: "success",     // 成功
    TAKE_CASH_STATE_FAIL   : "fail"         // 失败
};

// 订单状态
const ORDER_STATUS = {
    ORDER_STATUS_AUDIT_PENDING        : "pending",      // 待审核
    ORDER_STATUS_AUDIT_AUDITED        : "audited",      // 已审核、待收款
    ORDER_STATUS_AUDIT_REJECT         : "reject",       // 审核拒绝
    ORDER_STATUS_PAID_NONE            : "none",         // 未支付
    ORDER_STATUS_PAID_TIMEOUT         : "timeOut",      // 超时未支付
    ORDER_STATUS_PAID_HANG            : "hang",         // 支付挂起
    ORDER_STATUS_PAID_PART            : "partPaid",     // 部分支付
    ORDER_STATUS_PAID                 : "paid",         // 已支付
    ORDER_STATUS_ORDER_CANCEL         : "cancel",       // 取消订单
    ORDER_STATUS_ORDER_REFUND_PART    : "partRefund",   // 部分退款
    ORDER_STATUS_ORDER_REFUND_REFUNDED: "Refunded"      // 已退款
};

// 参会者支付状态
const ATTENDEE_PAY_STATUS = {
    ATTENDEE_PAY_STATUS_PAID: "paid",// 已支付
    ATTENDEE_PAY_STATUS_NONE: "none",// 未支付
};

// 支付方式
const PAYMENT_METHOD = {
    // 线上支付方式
    PAYMENT_METHOD_NONE    : "none",
    PAYMENT_METHOD_FREE    : "free",        // 免费
    PAYMENT_METHOD_ALIPAY  : "alipay",      // 支付宝
    PAYMENT_METHOD_PAYPAL  : "paypal",      // paypal
    PAYMENT_METHOD_WECHAT  : "wechat",      // 微信
    PAYMENT_METHOD_MASTER  : "master",      // master信用卡
    PAYMENT_METHOD_VISA    : "visa",        // visa
    PAYMENT_METHOD_EBANK   : "ebank",       // 网银支付
    PAYMENT_METHOD_WALLET  : "wallet",     // 钱包支付
    // 线下支付方式
    PAYMENT_METHOD_ONSITE  : "onsite",      // 现场缴费
    PAYMENT_METHOD_TRANSFER: "transfer",    // 银行转帐
};

const ATTENDEE_STATUS = {
    ATTENDEE_STATUS_NORMAL   : 'normal',// 未退票
    ATTENDEE_STATUS_REFUNDING: 'refunding',// 退款中
    ATTENDEE_STATUS_REFUNDED : 'refunded'// 已退款
};

const MEMBER_CONST = {
    STATUS_ACTIVE    : "active",
    STATUS_INACTIVE  : "inactive",
    STATUS_DELETED   : "deleted",
    NOTIFY_TYPE_EMAIL: "email",
    DUES_TYPE_FREE   : "free",
    DUES_TYPE_MONTH  : "month",
    DUES_MONTH_DAYS  : 31,
    DUES_TYPE_SEASON : "season",
    DUES_SEASON_DAYS : 92,
    DUES_TYPE_YEAR   : "year",
    DUES_YEAR_DAYS   : 366
};

// 发票类型
const INVOICE_TYPE = {
    INVOICE_TYPE_NORMAL : 'normal',// 增值税普通发票
    INVOICE_TYPE_SPECIAL: 'special',// 增值税专用发票
};

// 收票人类型
const RECEIVE_TYPE = {
    RECEIVE_TYPE_COMPANY : 'company',// 公司
    RECEIVE_TYPE_PERSONAL: 'personal',// 个人
};

// 发票开票状态
const INVOICE_STATUS = {
    INVOICE_STATUS_INVOICED  : 'invoiced',// 已开票
    INVOICE_STATUS_UNINVOICED: 'uninvoiced',// 未开票
    INVOICE_STATUS_PART      : 'part',// 部分开票
};

// 短信和邮件发送记录表,记录属性
const SEND_RECORD_ATTRIBUTE = {
    ATTRIBUTE_PROMOTION  : "promotion",    // 推广"promotion"   扣费
    ATTRIBUTE_NOTICEMENT : "noticement",   // 通知"noticement"  扣费
    ATTRIBUTE_COUPONSHARE: "couponShare",  // 优惠码分享"couponShare"
    ATTRIBUTE_MEMBERSHIP : "membership",   // 会员邮件"membership"
    ATTRIBUTE_INFORMS    : "systemInforms",// 系统通知-扣费
    ATTRIBUTE_SYSTEM     : "system"        // 系统通知-不扣费
};

// 短信和邮件发送记录表,记录类型,短信类型"sms",邮件类型"email"
const SEND_RECORD_TYPE = {
    RECORD_TYPE_SMS  : "sms",
    RECORD_TYPE_EMAIL: "email"
};

// 短信和邮件发送记录表,任务执行的时间类型,立即发送"sendImmediately",定时发送"timedTransmission"

const SEND_TYPE = {
    SEND_TYPE_IMMEDIATELY: "imediately",// 立即发送
    SEND_TYPE_TIMED      : "timed",     // 定时发送
};

// 短信和邮件发送记录表,发送状态
const RECORD_SEND_STATUS = {
    SEND_STATUS_TO_BE_SENT  : "toBeSent",  // 等待发送"toBeSent"
    SEND_STATUS_SENDING     : "sending",   // 发送中
    SEND_STATUS_PART_SUCCESS: 'partSuccess', //部分发送成功
    SEND_STATUS_SEND_FAIL   : "sendFail",  // 发送失败"sendFail"
    SEND_STATUS_DEDUCT_FAIL : "deductFail",// 扣款失败
    SEND_STATUS_SEND_SUCCESS: "sendSuccess"// 发送成功"sendSuccess"
};

// 邮件相关默认设置 
const RECORD_SEND_SET = {
    DEFAULT_FROM     : "support@eventdove.com",
    EMAIL_CHARGE_TYPE: ["promotion", "noticement", "couponShare"],  // 邮件 收费类型 
    SMS_CHARGE_TYPE  : ["promotion", "noticement", "membership"]    // 短信 收费类型
};

// 活动状态
const EVENT_STATUS = {
    EVENT_STATUS_UNPUBLISHED   : 'unpublished',// 未发布,用户保存的草稿状态的活动
    EVENT_STATUS_PUBLISHED     : 'published',// 已发布
    EVENT_STATUS_AUDIT_REJECTED: 'auditRejected',// 审核未通过
    EVENT_STATUS_HANG_UP       : 'hangUp',// 挂起
    EVENT_STATUS_CANCELED      : 'canceled',// 取消发布
    EVENT_STATUS_FINISHED      : 'finished',// 已结束
};

const YIMEI_FIXPARAMS = {
    CDKEY_PW: [
        {paramName: "cdkey", paramValue: "3SDK-EMS-0130-MGVPS"},
        {paramName: "password", paramValue: "182142"}
    ],
    API_URL : {
        sendUrlTest: "http://sdk4http.eucp.b2m.cn:8080/sdkproxy/sendsms.action",       // 短信发送测试url 
        sendUrl    : "http://sdkhttp.eucp.b2m.cn:8080/sdkproxy/sendsms.action"         // 短信发送url 
    },
    label   : "【会鸽】"
};

// 允许上传格式
const ALLOW_UPLOAD_FORMAT = {
    FILE_FORMAT: ".xlsx,.xlsm,.xlsb,.xls,.csv"        // 允许上传的文件格式
};

// excel 表头内容
const EXCEL_HEADSTR   = {
    ADDRESS_BOOK: 'name,email,phone,company,position,location'
};
const FILE_LIMIT_SIZE = {
    EXCEL_SIZE: 10 * 1024 * 1024
    // EXCEL_SIZE: 1
};

// 订单类型
const ORDER_TYPE = {
    ORDER_TYPE_MEMBER          : 'MEMBER',// 会员充值订单
    ORDER_TYPE_TICKET          : 'TICKET',// 门票订单
    ORDER_TYPE_SMS             : 'SMS',// 短信充值订单
    ORDER_TYPE_EMAIL           : 'EMAIL',// 邮件充值订单
    ORDER_TYPE_UNKNOWN         : 'UNKNOWN',// 未知类型订单
    ORDER_TYPE_REFUND_TICKET   : 'REFUND_TICKET',// 退票费用类型
    ORDER_TYPE_WITHDRAWALS     : 'WITHDRAWALS',// 提现类型
    ORDER_TYPE_SEND_SMS        : 'SEND_SMS',      // 短信扣费类型
    ORDER_TYPE_SEND_EMAIL      : 'SEND_EMAIL',    // 邮件扣费类型
    ORDER_TYPE_EVENT_SEND_EMAIL: 'EVENT_SEND_EMAIL',  // 活动邮件扣费类型
};

// 各种支付通道的费率
const CHANNEL_FEE_TYPE = {
    CHANNEL_FEE_TYPE_WECHAT: 0.006,// 微信支付通道费费率
    CHANNEL_FEE_TYPE_ALIPAY: 0.01,// 支付宝支付通道费费率
    CHANNEL_FEE_TYPE_PAYPAL: 0.01,// PayPal支付通道费费率
};

// 发票的领取方式
const INVOICE_DELIVER_METHOD = {
    INVOICE_DELIVER_METHOD_ONSITE : 'onsite',// 现场领取
    INVOICE_DELIVER_METHOD_EXPRESS: 'express',// 快递领取
};

// 用户证件类型
const USER_ID_TYPE = {
    USER_ID_TYPE_IDENTITY_CARD      : 'identityCard',// 身份证
    USER_ID_TYPE_PASSPORT           : 'passport',// 护照
    USER_ID_TYPE_TAIWAN_PASSPORT    : 'taiwanPassport',// 台湾居民来往大陆通行证
    USER_ID_TYPE_HK_PASSPORT        : 'HKPassport',// 港澳居民来往内地通行证
    USER_ID_TYPE_HK_IDENTITY_CARD   : 'HKIdentityCard',// 香港/澳门居民身份证
    USER_ID_TYPE_OTHER_IDENTITY_CARD: 'otherIdentityCard',// 其他
};

// 第三方登录注册类型
const USER_REGISTER_TYPE = {
    USER_REGISTER_TYPE_DEFAULT: 'evetdove',    // 会鹆注册登录
    USER_REGISTER_TYPE_SINA   : 'sina',        // 新浪微博登录
    USER_REGISTER_TYPE_WEIXIN : 'wx',          // 微信登录
    USER_REGISTER_TYPE_QQ     : 'qq',          // QQ登录
};

// 第三方登录请求接口地址
const USER_REGISTER_URL = {
    SINA_ACCESS_TOKEN: 'https://api.weibo.com/oauth2/access_token', // 获取SINA token接口
    SINA_USER_SHOW   : 'https://api.weibo.com/2/users/show.json',   // 获取SINA 授权用户详细信息接口
    WX_ACCESS_TOKEN  : 'https://api.weixin.qq.com/sns/oauth2/access_token', // 获取微信token
    WX_GET_USER_INFO : 'https://api.weixin.qq.com/sns/userinfo',    // 获取用户个人信
    QQ_ME            : 'https://graph.qq.com/oauth2.0/me',          // 获取QQ OpenId接口
    QQ_GET_USER_INFO : 'https://graph.qq.com/user/get_user_info'    // 获取QQ 授权用户详细信息接口
};

// 用户认证状态
const USER_ID_STATUS = {
    USER_ID_STATUS_AUDITING     : 'auditing',// 审核中
    USER_ID_STATUS_AUDIT_FAILURE: 'auditFailure',// 审核失败
    USER_ID_STATUS_AUDIT_THROUGH: 'auditThrough',// 审核通过
};

// 企业银行账户审核状态
const BUSINESS_ACCOUNT_AUDIT_STATUS = {
    BUSINESS_ACCOUNT_AUDIT_STATUS_AUDITING     : 'auditing',// 审核中
    BUSINESS_ACCOUNT_AUDIT_STATUS_AUDIT_FAILURE: 'auditFailure',// 审核失败
    BUSINESS_ACCOUNT_AUDIT_STATUS_AUDIT_THROUGH: 'auditThrough',// 审核通过
};

// 提现记录表中的帐号类型
const WITHDRAW_ACCOUNT_TYPE = {
    WITHDRAW_ACCOUNT_TYPE_PERSONAL: 'personal',// 个人账户
    WITHDRAW_ACCOUNT_TYPE_BUSINESS: 'business',// 对公账户
};

// 提现状态
const WITHDRAW_STATUS = {
    WITHDRAW_STATUS_SUBMIT_APPLICATION: 'submitApplication',// 提交提现申请
    WITHDRAW_STATUS_SUCCESS           : 'success',// 提现成功
    WITHDRAW_STATUS_FAIL              : 'fail',// 提现失败
};

// 系统和用户短信邮件模板类型
const SMS_EMAIL_TEMPLATE_TEMPLATE_TYPE = {
    TEMPLATE_TYPE_SMS  : "sms",// 短信"sms"
    TEMPLATE_TYPE_EMAIL: "email"// 邮件"email"
};

// 短信邮件充值时每条多少钱
const SMS_EMAIL_PRICE = {
    SMS_PRICE  : 0.1,// 短信1毛钱
    EMAIL_PRICE: 0.01// 邮件1分钱
};

const REDIS_PREFIX = {
    USER_PACKAGE           : 'user_package_',
    MULTI_AUTHORIZATION    : 'multi_authorization_',
    BLACK_ROUTES           : 'black_routes_',
    EVENT_BROWSE_COUNT     : 'event_browse_count_',// 活动浏览次数
    EVENT_USER_BROWSE_COUNT: 'event_user_browse_count_',// 活动浏览用户数
};

const FEEDBACK_TYPE = {
    FEEDBACK_TYPE_PROBLEM   : 'problem',
    FEEDBACK_TYPE_SUGGESTION: 'suggestion',
    FEEDBACK_TYPE_DEMAND    : 'demand',
    FEEDBACK_TYPE_OTHER     : 'other'
};

const BANK_LIST = [
    {key: "中国工商银行", val: "中国工商银行"},
    {key: "中国银行", val: "中国银行"},
    {key: "中国建设银行", val: "中国建设银行"},
    {key: "中国农业银行", val: "中国农业银行"},
    {key: "招商银行", val: "招商银行"},
    {key: "中国邮政储蓄银行", val: "中国邮政储蓄银行"},
    {key: "中国光大银行", val: "中国光大银行"},
    {key: "上海浦东发展银行", val: "上海浦东发展银行"},
    {key: "深圳发展银行", val: "深圳发展银行"},
    {key: "兴业银行", val: "兴业银行"},
    {key: "平安银行", val: "平安银行"},
    {key: "广东发展银行", val: "广东发展银行"},
    {key: "中信银行", val: "中信银行"},
    {key: "交通银行", val: "交通银行"},
    {key: "中国民生银行", val: "中国民生银行"},
    {key: "台州商业银行", val: "台州商业银行"},
    {key: "杭州银行", val: "杭州银行"},
    {key: "东莞农村商业银行", val: "东莞农村商业银行"},
    {key: "苏州银行", val: "苏州银行"},
    {key: "农村商业银行", val: "农村商业银行"},
    {key: "华夏银行", val: "华夏银行"},
    {key: "南京银行", val: "南京银行"},
    {key: "东莞银行", val: "东莞银行"},
    {key: "北京银行", val: "北京银行"},
    {key: "贵阳银行", val: "贵阳银行"},
    {key: "宁波银行", val: "宁波银行"},
    {key: "上海农商银行", val: "上海农商银行"},
    {key: "汉口银行", val: "汉口银行"},
    {key: "杭州联合农村商业银行", val: "杭州联合农村商业银行"},
    {key: "宁夏银行股份有限公司", val: "宁夏银行股份有限公司"},
    {key: "廊坊银行", val: "廊坊银行"},
    {key: "珠海农村商业银行", val: "珠海农村商业银行"},
    {key: "杭州联合银行", val: "杭州联合银行"},
    {key: "台州银行股份有限公司", val: "台州银行股份有限公司"},
    {key: "上海银行", val: "上海银行"},
    {key: "徽商银行", val: "徽商银行"},
    {key: "葫芦岛银行", val: "葫芦岛银行"},
    {key: "农村合作信用社", val: "农村合作信用社"},
    {key: "长沙银行", val: "长沙银行"},
    {key: "浙江泰隆商业银行", val: "浙江泰隆商业银行"},
    {key: "锦州银行", val: "锦州银行"},
    {key: "广东华兴银行", val: "广东华兴银行"},
    {key: "乐山市商业银行", val: "乐山市商业银行"},
    {key: "渤海银行", val: "渤海银行"},
    {key: "江苏银行", val: "江苏银行"},
    {key: "成都银行", val: "成都银行"},
    {key: "洛阳银行", val: "洛阳银行"},
    {key: "青岛银行", val: "青岛银行"},
    {key: "富滇银行", val: "富滇银行"},
    {key: "包商银行", val: "包商银行"},
    {key: "兆丰村镇银行", val: "兆丰村镇银行"},
    {key: "北京农商银行", val: "北京农商银行"},
    {key: "天津银行", val: "天津银行"},
    {key: "桂林银行", val: "桂林银行"},
    {key: "晋中银行", val: "晋中银行"},
    {key: "邯郸银行", val: "邯郸银行"},
    {key: "香港上海汇丰银行", val: "香港上海汇丰银行"},
    {key: "齐鲁银行", val: "齐鲁银行"},
    {key: "盘锦市商业银行", val: "盘锦市商业银行"},
    {key: "中原银行", val: "中原银行"},
    {key: "郑州银行", val: "郑州银行"},
    {key: "盛京银行", val: "盛京银行"},
    {key: "张家口市商业银行", val: "张家口市商业银行"},
    {key: "甘肃银行", val: "甘肃银行"},
    {key: "香港星展銀行", val: "香港星展銀行"},
    {key: "日照银行", val: "日照银行"},
    {key: "承德银行", val: "承德银行"},
    {key: "河北银行", val: "河北银行"},
    {key: "广东南粤银行", val: "广东南粤银行"},
    {key: "内蒙古银行", val: "内蒙古银行"},
    {key: "广州银行", val: "广州银行"},
    {key: "营口银行", val: "营口银行"},
    {key: "葫芦岛市商业银行", val: "葫芦岛市商业银行"},
    {key: "邢台银行", val: "邢台银行"},
    {key: "乌海银行", val: "乌海银行"},
    {key: "晋商银行", val: "晋商银行"},
    {key: "东亚银行", val: "东亚银行"},
    {key: "商业银行", val: "商业银行"},
    {key: "哈尔滨银行股份有限公司", val: "哈尔滨银行股份有限公司"},
    {key: "潍坊银行", val: "潍坊银行"},
    {key: "莱州农村商业银行", val: "莱州农村商业银行"},
    {key: "泰安商业银行", val: "泰安商业银行"},
    {key: "石狮农商银行", val: "石狮农商银行"},
    {key: "龙江银行", val: "龙江银行"},
    {key: "长安银行", val: "长安银行"},
    {key: "晋城银行", val: "晋城银行"},
    {key: "秦皇岛市商业银行", val: "秦皇岛市商业银行"},
    {key: "保定银行", val: "保定银行"},
    {key: "恒丰银行", val: "恒丰银行"},
    {key: "朝阳银行", val: "朝阳银行"},
    {key: "西安银行", val: "西安银行"},
    {key: "金华银行", val: "金华银行"},
    {key: "齐商银行", val: "齐商银行"},
    {key: "芜湖津盛农村商业银行股份有限公司", val: "芜湖津盛农村商业银行股份有限公司"},
    {key: "南海农商银行", val: "南海农商银行"},
    {key: "乐清农商银行", val: "乐清农商银行"},
    {key: "兰州银行", val: "兰州银行"},
    {key: "山东济南润丰农村合作银行", val: "山东济南润丰农村合作银行"},
    {key: "江西银行", val: "江西银行"},
    {key: "浙商银行", val: "浙商银行"},
    {key: "武汉农村商业银行", val: "武汉农村商业银行"},
    {key: "伊川农商银行", val: "伊川农商银行"}
];

const TEXT_ALIGN = {
    CENTER: 'center',
    END   : 'end',
    LEFT  : 'left',
    RIGHT : 'right',
    START : 'start'
};

// 退款类型
const REFUND_TYPE = {
    REFUND_TYPE_TICKET: 'TICKET',// 门票退款
};

// 退款渠道
const REFUND_CHANNEL = {

    // 线上退款方式
    REFUND_CHANNEL_ALIPAY: 'alipay',// 支付宝退款
    REFUND_CHANNEL_PAYPAL: 'paypal',// 贝宝退款
    REFUND_CHANNEL_WECHAT: 'wechat',// 微信退款

    // 线下退款方式
    REFUND_CHANNEL_TRANSFER: "transfer",// 银行转帐
};

// 退款订单状态
const REFUND_STATUS = {
    REFUND_STATUS_APPLY  : 'apply',// 已提交申请
    REFUND_STATUS_SUCCESS: 'success',// 退款成功
    REFUND_STATUS_FAIL   : 'fail',// 退款失败
};

exports.CURRENCY_NAME                    = CURRENCY_NAME;
exports.PAYMENT_PRICE_UNIT_SIGN          = PAYMENT_PRICE_UNIT_SIGN;
exports.RECEIVING_PLAT_FORM              = RECEIVING_PLAT_FORM;
exports.USER_ACCOUNT_STATE               = USER_ACCOUNT_STATE;
exports.ORDER_PLATFORM                   = ORDER_PLATFORM;
exports.TAKE_CASH_STATE                  = TAKE_CASH_STATE;
exports.ORDER_STATUS                     = ORDER_STATUS;
exports.PAYMENT_METHOD                   = PAYMENT_METHOD;
exports.ATTENDEE_STATUS                  = ATTENDEE_STATUS;
exports.MEMBER_CONST                     = MEMBER_CONST;
exports.INVOICE_TYPE                     = INVOICE_TYPE;
exports.SENDRECORD_ATTRIBUTE             = SEND_RECORD_ATTRIBUTE;
exports.SEND_RECORD_TYPE                 = SEND_RECORD_TYPE;
exports.RECORD_SEND_STATUS               = RECORD_SEND_STATUS;
exports.RECORD_SEND_SET                  = RECORD_SEND_SET;
exports.EVENT_STATUS                     = EVENT_STATUS;
exports.YIMEIPARAMS                      = YIMEI_FIXPARAMS;
exports.ALLOW_UPLOAD_FORMAT              = ALLOW_UPLOAD_FORMAT;
exports.EXCEL_HEADSTR                    = EXCEL_HEADSTR;
exports.ORDER_TYPE                       = ORDER_TYPE;
exports.CHANNEL_FEE_TYPE                 = CHANNEL_FEE_TYPE;
exports.FILE_LIMIT_SIZE                  = FILE_LIMIT_SIZE;
exports.INVOICE_DELIVER_METHOD           = INVOICE_DELIVER_METHOD;
exports.INVOICE_STATUS                   = INVOICE_STATUS;
exports.USER_ID_TYPE                     = USER_ID_TYPE;
exports.USER_ID_STATUS                   = USER_ID_STATUS;
exports.BUSINESS_ACCOUNT_AUDIT_STATUS    = BUSINESS_ACCOUNT_AUDIT_STATUS;
exports.WITHDRAW_ACCOUNT_TYPE            = WITHDRAW_ACCOUNT_TYPE;
exports.WITHDRAW_STATUS                  = WITHDRAW_STATUS;
exports.SMS_EMAIL_TEMPLATE_TEMPLATE_TYPE = SMS_EMAIL_TEMPLATE_TEMPLATE_TYPE;
exports.SMS_EMAIL_PRICE                  = SMS_EMAIL_PRICE;
exports.REDIS_PREFIX                     = REDIS_PREFIX;
exports.USER_REGISTER_TYPE               = USER_REGISTER_TYPE;
exports.USER_REGISTER_URL                = USER_REGISTER_URL;
exports.ATTENDEE_PAY_STATUS              = ATTENDEE_PAY_STATUS;
exports.SEND_TYPE                        = SEND_TYPE;
exports.BANK_LIST                        = BANK_LIST;
exports.RECEIVE_TYPE                     = RECEIVE_TYPE;
exports.FEEDBACK_TYPE                    = FEEDBACK_TYPE;
exports.TEXT_ALIGN                       = TEXT_ALIGN;

exports.REFUND_TYPE    = REFUND_TYPE;
exports.REFUND_CHANNEL = REFUND_CHANNEL;
exports.REFUND_STATUS  = REFUND_STATUS;
