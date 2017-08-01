/**
 * Created by Henry on 2017/3/15.
 */

const qs = require('querystring');
const fs = require('fs');
const https = require('https');
const url = require('url');
const assert = require('assert');
const crypto = require('crypto');
const _ = require('lodash');

const AlipayConfig = require('./config').AlipayConfig;

/*
 * 接口文档
 * https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.YkVeEO&treeId=62&articleId=104743&docType=1
 */

/**
 * 创建支付表单
 * @param data
 * @returns {提交表单HTML文本}
 */
exports.directPayByUser = function (data) {
    assert.ok(data.out_trade_no && data.subject && data.total_fee);
    const params = {
        partner: AlipayConfig.partner,
        service: 'create_direct_pay_by_user',
        payment_type: '1',
        notify_url: AlipayConfig.host + AlipayConfig.notify_url,
        return_url: AlipayConfig.host + AlipayConfig.return_url,
        _input_charset: AlipayConfig.input_charset.toLowerCase().trim(),
        seller_email: AlipayConfig.seller_email,
    };
    for (const key in data) {
        params[key] = data[key];
    }

    return __buildRequestForm(params, 'get', 'OK');
};

/**
 * 针对notify_url验证消息是否是支付宝发出的合法消息
 * @return 验证结果
 */
exports.verifyNotify = function (data, callback) {
    if (Object.keys(data).length === 0) {
        callback(false);
    }
    // 签名结果
    const isSign = __getSignVeryfy(data, data.sign);
    // 获取支付宝远程服务器ATN结果（验证是否是支付宝发来的消息）
    const responseTxt = 'true';
    // 验证
    // responsetTxt的结果不是true，与服务器设置问题、合作身份者ID、notify_id一分钟失效有关
    // isSign的结果不是true，与安全校验码、请求时的参数格式（如：带自定义参数等）、编码格式有关
    if (!_.isEmpty(data.notify_id)) {
        __getResponse(data.notify_id, (responseTxt) => {
            callback(responseTxt === 'true' && isSign);
        });
    } else {
        callback(responseTxt === 'true' && isSign);
    }
};

/**
 * 获取远程服务器ATN结果,验证返回URL
 * @param notify_id 通知校验ID
 * @return 服务器ATN结果
 * 验证结果集：
 * invalid命令参数不对 出现这个错误，请检测返回处理中partner和key是否为空
 * true 返回正确信息
 * false 请检查防火墙或者是服务器阻止端口问题以及验证时间是否超过一分钟
 */
function __getResponse(notify_id, callback) {
    const partner = AlipayConfig.partner.trim();
    const veryfy_url = `${AlipayConfig.https_verify_url}partner=${partner}&notify_id=${notify_id}`;
    __getHttpResponseGET(veryfy_url, callback);
}

/**
 * 远程获取数据，GET模式
 * 注意：
 * @param url 指定URL完整路径地址
 * return 远程输出的数据
 */
function __getHttpResponseGET(veryfy_url, callback) {
    const req = https.get(veryfy_url, (res) => {
        let responseText = '';
        res.on('data', (chunk) => {
            responseText += chunk;
        });
        res.on('end', () => {
            callback && callback(responseText);
        });
    });
    req.on('error', (err) => {
        callback(err);
    });
    req.end();
}

/**
 * 生成签名结果
 * @param para_sort 已排序要签名的数组
 * return 签名结果字符串
 */
function __buildRequestMysign(para_sort) {
    // 把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    const prestr = __createLinkString(para_sort);

    let mysign = '';

    const sign_type = AlipayConfig.sign_type.trim().toUpperCase();
    if (sign_type == 'MD5') {
        mysign = __md5Sign(prestr, AlipayConfig.key);
    } else {
        mysign = '';
    }
    return mysign;
}

function __buildRequestPara(para_temp) {
    const para_filter = __paraFilter(para_temp);

    // 对待签名参数数组排序
    const para_sort = __argSort(para_filter);

    // 生成签名结果
    const mysign = __buildRequestMysign(para_sort);

    // 签名结果与签名方式加入请求提交参数组中
    para_sort.sign = mysign;
    para_sort.sign_type = AlipayConfig.sign_type.trim().toUpperCase();

    return para_sort;
}

/**
 * 建立请求，以表单HTML形式构造（默认）
 * @param para_temp 请求参数数组
 * @param method 提交方式。两个值可选：post、get
 * @param button_name 确认按钮显示文字
 * @return 提交表单HTML文本
 */
function __buildRequestForm(para_temp, method, button_name) {
    const para = __buildRequestPara(para_temp);

    let sHtml = `<form id='alipaysubmit' name='alipaysubmit' action='${AlipayConfig.alipay_gateway}_input_charset=${AlipayConfig.input_charset.toLowerCase().trim()}' method='${method}'>`;

    for (const key in para) {
        const val = para[key];
        sHtml += `<input type='hidden' name='${key}' value='${val}'/>`;
    }

    // submit按钮控件请不要含有name属性
    sHtml = `${sHtml}<input type='submit' value='${button_name}'></form>`;

    // sHtml += "<script>document.forms['alipaysubmit'].submit();</script>";

    return sHtml;
}

/**
 * 把对象所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
 * @param para 需要拼接的对象
 * @private 拼接完成以后的字符串
 */
function __createLinkString(para) {
    let linkString = '';
    for (const key in para) {
        linkString = `${linkString + key}=${para[key]}&`;
    }
    linkString = linkString.substring(0, linkString.length - 1);
    return linkString;
}

/**
 * 把对象所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串，并对字符串做urlencode编码
 * @param para 需要拼接的对象
 * return 拼接完成以后的字符串
 */
exports.createLinkstringUrlencode = function (para) {
    return qs.stringify(para);
};

/**
 * 除去对象中的空值和签名参数
 * @param para 签名参对象
 * return 去掉空值与签名参数后的新签名参对象
 */
function __paraFilter(para) {
    const para_filetr = {};
    for (const key in para) {
        if (key === 'sign' || key === 'sign_type' || para[key] === '') {
            continue;
        } else {
            para_filetr[key] = para[key];
        }
    }
    return para_filetr;
}

/**
 * 对对象排序
 * @param para 排序前的对象
 * return 排序后的对象
 */
function __argSort(para) {
    const result = {};
    const keys = Object.keys(para).sort();
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        result[k] = para[k];
    }
    return result;
}

/**
 * 签名字符串
 * @param prestr 需要签名的字符串
 * @param key 私钥
 * return 签名结果
 */
function __md5Sign(prestr, key) {
    const tempStr = prestr + key;
    return crypto.createHash('md5').update(tempStr, 'utf8').digest('hex');
}

/**
 * 验证签名
 * @param prestr 需要签名的字符串
 * @param sign 签名结果
 * @param key 私钥
 * return 签名结果
 */
function __md5Verify(prestr, sign, key) {
    const tempStr = prestr + key;
    const mysgin = crypto.createHash('md5').update(tempStr, 'utf8').digest('hex');

    if (mysgin === sign) {
        return true;
    }
    return false;
}

/**
 * 获取返回时的签名验证结果
 * @param para_temp 通知返回来的参数数组
 * @param sign 返回的签名结果
 * @return 签名验证结果
 */
function __getSignVeryfy(para_temp, sign) {
    // 除去待签名参数数组中的空值和签名参数
    const para_filter = __paraFilter(para_temp);

    // 对待签名参数数组排序
    const para_sort = __argSort(para_filter);

    // 把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    const prestr = __createLinkString(para_sort);

    let isSgin = false;

    const sign_type = AlipayConfig.sign_type.trim().toUpperCase();
    if (sign_type == 'MD5') {
        isSgin = __md5Verify(prestr, sign, AlipayConfig.key);
    } else {
        isSgin = false;
    }
    return isSgin;
}
