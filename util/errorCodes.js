// 对于错误码的返回结构如下
//{
//	errorCode:1,
//	responseText:'error message here'
//}
//其中code用户客户端来标识具体错误原因，errorMsg使用国际化字符串解释错误原因

var evtErrorCode = {

    /** 成功 */
    COMMON_SUCCESS: 0,
    //通用错误码
    ERR_INVALID_PARAMETERS: 1,
    ERR_INTERNAL_SERVER: 2,
    /** 资源不存在 */
    ERR_NOT_FOUND: 8,
    /** 没有权限 */
    ERR_PERMISSION_DENIED: 9,


    //user相关的错误码
    USER_NAME_EXISTED: 1000,

    // 活动相关的错误码
    EVENT_DOMAIN_NAME_IS_EXIST:2000,
    EVENT_NOT_EXIST:2001,
    EVENT_SEARCH_TEXT_TOO_SHORT:2002,
    EVENT_TITLE_IS_EXIST:2003,


    //order相关的错误码
    ORDER_FILED_IS_NOT_UNIQUEUE: 2000,
    ORDER_FILED_MISSING_REQUIRED: 2001,
    ORDER_TICKETS_NOT_SUFFICIENT: 2002,

    // discount相关的错误码
    DISCOUNT_PARAM_IS_NULL: 3001,
    DISCOUNT_IS_NOTEXIST: 3002,
    DISCOUNT_IS_DELETED: 3003,

    // SmsEmailSendRecord 相关的错误码
    EMAIL_SEND_RECORD_USERID_EVENTID:201,
    NOT_SUFFICIENT_EMAIL:202,
    EMAIL_SEND_RECORD_SENDTIME_IS_NULL:1000,
    EMAIL_SEND_RECORD_EMAILTITLE_IS_NULL:10001,
    EMAIL_SEND_RECORD_EVENTID_IS_NULL:10002,
    EMAIL_SEND_RECORD_ID_IS_NULL:10002,
    EMAIL_SEND_RECORD_TYPE_IS_NULL:10003,
    EMAIL_SEND_RECORD_NOT_SUFFICIENT_FUNDS:10004,
    EMAIL_SEND_RECORD_CONTENT_ABOVE_QUOTA:10005,

    // AddressBook 相关错误码
    ADDRESS_BOOK_EMAIL_EXISTS:1000,
    ADDRESS_BOOK_NOT_EXISTS:1001,
    ADDRESS_BOOK_TAGNAME_IS_NULL:1002,
    ADDRESS_BOOK_FILE_FORMAT_ERR:1003,
    ADDRESS_BOOK_FILE_SIZE_ERR:1004,

    // BEGIN 多用户授权
    /** 用户不存在 */
    MULTI_AUTHORIZATION_USER_NOT_EXSIT: 9000,
    /** 此用户已经分配权限 */
    MULTI_AUTHORIZATION_HAS_BEEN_AUTHORIZED: 9001,
    // END 多用户授权

    // BEING 会员、会员组
    /** 会员组不存在 */
    MEMBERSHIP_NOT_EXSIT: 9100,
    MEMBERSHIP_IS_FREE: 9101,

    /** 会员不存在 */
    MEMBER_NOT_EXSIT: 9200,
    /** 会员激活失败 */
    MEMBER_ACTIVATION_FAILED: 9201,
    // END 会员、会员组
    //参会人员导入文件 错误码
    REGISTERLISTFILES_INVALID: 1010,
};

exports.ErrorCodes = evtErrorCode;
