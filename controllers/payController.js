'use strict';

const _             = require('lodash');
const fs            = require('fs');
const Big           = require('big.js');
const moment        = require('moment');
const PayPalIPN     = require('paypal-ipn');
const settings      = require("../conf/settings");
const logger        = require('winston').loggers.get(settings.logger.categoryName);
const myutil        = require('../util/util');
const fixParams     = require('../util/fixParams');
const errorCodes    = require('../util/errorCodes.js').ErrorCodes;
const r             = require('../util/thinky.js').r;
const WXPay         = require('../services/pay/wxpay/wxpay');
const WxPayConfig   = require('../services/pay/wxpay/config').WxPayConfig;
const PayPalConfig  = require('../services/pay/paypal/config').PayPalConfig;
const Alipay        = require('../services/pay/alipay/alipay');
const DealWxPay     = require('../services/pay/wxpay/dealWxPay');
const DealAliPay    = require('../services/pay/alipay/dealAliPay');
const DealPayPal    = require('../services/pay/paypal/dealPayPal');
const Transaction   = require('../model/transaction');
const Order         = require('../model/order');
const smsEmailOrder = require('../model/notice');
const RefundOrder   = require('../model/refund');
const sysNotice     = require('../model/admin/sysNotice');
const autoCloseHtml = `<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>支付成功</title> </head> <body> <script> function closewin() { self.opener = null; self.close(); } function clock() { i = i - 1; document.title = "本窗口将在" + i + "秒后自动关闭!"; if (i > 0) { setTimeout("clock()", 1000); } else { closewin(); } } var i = 1; clock(); </script> </body> </html> `;

// 微信-创建统一支付订单
exports.wxpayNativeCreateUnifiedOrder = async function (req, res, next) {
    try {
        const body        = req.body;
        const orderNumber = body.orderNumber;
        let reqParams     = {};

        // 分情况处理请求参数
        if (orderNumber.startsWith('DD')) { // 门票订单
            reqParams = await DealWxPay.makeWxTicketOrderReqParams(req, res, next);
        } else if (orderNumber.startsWith('M')) { // 会员订单
            // todo 会员订单支付参数组装
        } else if (orderNumber.startsWith('S')) { // 短信充值
            req.orderType = fixParams.ORDER_TYPE.ORDER_TYPE_SMS;
            reqParams     = await DealWxPay.makeWxSmsEmailOrderReqParams(req, res, next);
        } else if (orderNumber.startsWith('E')) { // 邮件
            req.orderType = fixParams.ORDER_TYPE.ORDER_TYPE_EMAIL;
            reqParams     = await DealWxPay.makeWxSmsEmailOrderReqParams(req, res, next);
        }

        if (_.isEmpty(reqParams)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('Empty', 'reqParams'),
            });
        }

        const wxPayObj = WXPay({
            appid      : WxPayConfig.WX_APP_ID,
            mch_id     : WxPayConfig.WX_PARTNER_ID,
            partner_key: WxPayConfig.WX_PARTNER_KEY,
        });

        wxPayObj.createUnifiedOrder(reqParams, async function (err, result) {

            logger.debug('orderNumber = ', orderNumber, ' 微信创建统一订单接口被调用返回的错误信息start---------------------------------------');
            logger.debug(err);
            logger.debug('orderNumber = ', orderNumber, ' 微信创建统一订单接口被调用返回的错误信息end---------------------------------------');
            logger.debug('orderNumber = ', orderNumber, ' 微信创建统一订单接口被调用返回的正确结果start---------------------------------------');
            logger.debug(result);
            logger.debug('orderNumber = ', orderNumber, ' 微信创建统一订单接口被调用返回的正确结果end---------------------------------------');

            if (err) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: err.message
                });
            }

            if (_.isEmpty(result)) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: '生成二维码失败,请稍候再试...'
                });
            }

            if (result.return_msg !== 'OK') {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: result.return_msg
                });
            }

            const isSuccess = (result.return_code === 'SUCCESS')
                && (result.result_code === 'SUCCESS')
                && (!_.isEmpty(result.trade_type))
                && (!_.isEmpty(result.prepay_id))
                && (!_.isEmpty(result.code_url));

            if (!isSuccess) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: result.err_code_des
                });
            }

            const QRcode = await myutil.getQRcode(result.code_url);
            res.set({'Content-Type': 'image/svg+xml'});
            return res.status(200).send(QRcode);
        });

    } catch (err) {
        logger.error('wxpayNativeCreateUnifiedOrder', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};


//微信JSAPI预付订单
exports.wxpayJSAPICreateUnifiedOrder = async function (req, res, next) {

    try{
        const body          = req.body;
        const orderNumber   = body.orderNumber;
        const productName   = body.productName||'wechat';
        const openid        = body.openid||'ozaQn1VsXoNa0eUwgAXB9yCzLLaw';

        let orderInfo={};

        // 分情况获取订单参数
        if (orderNumber.startsWith('DD')) { // 门票订单
            orderInfo = await Order.getOrderByOrderNum(orderNumber,['totalPrice']);
        } else if (orderNumber.startsWith('M')) { // 会员订单
            // todo 会员订单支付参数组装
        } else if (orderNumber.startsWith('S')) { // 短信充值
            orderInfo = await smsEmailOrder.getSmsEmailOrderByOrderNum(orderNumber,['totalPrice']);
        } else if (orderNumber.startsWith('E')) { // 邮件
            orderInfo = await smsEmailOrder.getSmsEmailOrderByOrderNum(orderNumber,['totalPrice']);
        }
        const wxPayObj = WXPay({
            appid      : WxPayConfig.WX_APP_ID,
            mch_id     : WxPayConfig.WX_PARTNER_ID,
            partner_key: WxPayConfig.WX_PARTNER_KEY,
        });

        //预付订单信息
        const order = {
          body              : productName,
          out_trade_no      : orderNumber,
          total_fee         : orderInfo.totalPrice*100,
          openid            : openid,
          trade_type        : 'JSAPI',
          spbill_create_ip  : myutil.getClientIp(req),
          notify_url        : WxPayConfig.WX_NOTIFY_URL
        };
        wxPayObj.getBrandWCPayRequestParams(order, async function (err, result) {

            logger.debug('orderNumber = ', orderNumber, ' 微信创建JSAPI预付订单返回的错误信息start---------------------------------------');
            logger.debug(err);
            logger.debug('orderNumber = ', orderNumber, ' 微信创建JSAPI预付订单返回的错误信息end---------------------------------------');
            logger.debug('orderNumber = ', orderNumber, ' 微信创建JSAPI预付订单返回的正确结果start---------------------------------------');
            logger.debug(result);
            logger.debug('orderNumber = ', orderNumber, ' 微信创建JSAPI预付订单返回的正确结果end---------------------------------------');
            if (err) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: err.message
                });
            }
            return res.status(200).send(result);
        });
    }catch(err){
        logger.error('wxpayJSAPICreateUnifiedOrder', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }

}

// 微信支付结果异步通知
exports.wxpayNotify = async function (req, res, next) {

    const wxPayObj = WXPay({
        appid      : WxPayConfig.WX_APP_ID,
        mch_id     : WxPayConfig.WX_PARTNER_ID,
        partner_key: WxPayConfig.WX_PARTNER_KEY,
    });

    const myfunc = wxPayObj.useWXCallback(async function (result, WxReq, WxRes, WxNext) {

        logger.debug('--------------------微信异步通知被调用,返回的result信息start---------------------------------------');
        logger.debug(result);
        logger.debug('--------------------微信异步通知被调用,返回的result信息end---------------------------------------');

        if (result.return_code !== 'SUCCESS') {
            return WxRes.fail();
        }

        const isSuccess = (result.return_code === 'SUCCESS')
            && (result.result_code === 'SUCCESS')
            && (!_.isEmpty(result.openid))
            && (!_.isEmpty(result.bank_type))
            && (!_.isEmpty(result.trade_type))
            && (!_.isEmpty(result.out_trade_no))
            && (!_.isEmpty(result.total_fee))
            && (!_.isEmpty(result.transaction_id))
            && (!_.isEmpty(result.sign))
            && (!_.isEmpty(result.time_end));

        if (!isSuccess) {
            return WxRes.fail();
        }

        const openid         = result.openid;// 用户在商户appid下的唯一标识
        const bank_type      = result.bank_type;// 银行类型，采用字符串类型的银行标识
        const trade_type     = result.trade_type;// JSAPI、NATIVE、APP
        const orderNumber    = result.out_trade_no;// 商户订单号
        const total_fee      = Number(result.total_fee);// 订单总金额，单位为分
        const transaction_id = result.transaction_id;// 微信支付订单号
        const sign           = result.sign;// 签名
        const time_end       = result.time_end;// 支付完成时间，格式为yyyyMMddHHmmss，如2009年12月25日9点10分10秒表示为20091225091010

        // 签名验证
        const isValidSign = DealWxPay.verifyWxSign(result, wxPayObj);
        if (!isValidSign) {
            return WxRes.fail();
        }

        // 处理商户业务逻辑

        if (orderNumber.startsWith('DD')) { // 门票订单
            return await DealWxPay.dealWxTicketOrderNotify(result, WxReq, WxRes, WxNext, req);
        } else if (orderNumber.startsWith('M')) { // 会员订单
            // todo 会员订单
        } else if (orderNumber.startsWith('S')) { // 短信充值
            // 短信充值
            result.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_SMS;
            return await DealWxPay.dealWxSmsEmailOrderNotify(result, WxReq, WxRes, WxNext, req);
        } else if (orderNumber.startsWith('E')) { // 邮件
            // 邮件
            result.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_EMAIL;
            return await DealWxPay.dealWxSmsEmailOrderNotify(result, WxReq, WxRes, WxNext, req);
        }

        return WxRes.fail();
    });
    myfunc(req, res, next);
};

//微信jsapi支付回调
exports.wxJSAPIpayNotify = async function (req, res, next) {
    logger.debug('--------微信jsapi支付回调--------');
    res.reply('success');

};



// 支付宝异步通知
exports.aliPayDirectPayNotify = function (request, response) {

    const body = request.body;
    response.contentType('text/html');

    try {

        Alipay.verifyNotify(body, async (verify_result) => {

            if (!verify_result) {
                return response.send('fail');
            }

            const trade_status = body.trade_status;
            const out_trade_no = body.out_trade_no;
            if ('TRADE_SUCCESS' === trade_status || 'TRADE_FINISHED' === trade_status) {

                // 分情况处理订单
                if (out_trade_no.startsWith('DD')) { // 门票订单
                    if (!await DealAliPay.dealAliPayTicketOrderNotify(request, body)) {
                        return response.send('fail');
                    }
                } else if (out_trade_no.startsWith('M')) { // 会员订单
                    // 如果流水表插入失败返回fail，等待支付再通知
                    if (!await DealAliPay.dealWithMemberOrderByAliPay(body)) {
                        return response.send('fail');
                    }
                } else if (out_trade_no.startsWith('S')) { // 短信充值
                    body.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_SMS;
                    if (!await DealAliPay.dealAliPaySmsEmailOrderNotify(request, body)) {
                        return response.send('fail');
                    }
                } else if (out_trade_no.startsWith('E')) { // 邮件
                    body.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_EMAIL;
                    if (!await DealAliPay.dealAliPaySmsEmailOrderNotify(request, body)) {
                        return response.send('fail');
                    }
                }

                return response.send('success');

            }

            return response.send('fail');

        });

    } catch (err) {
        logger.error('aliPayDirectPayNotify ', err);
        return response.send('fail');
    }

};

// 支付宝同步通知
exports.alipayDirectPayReturn = function (req, res, next) {
    res.contentType('text/html');
    return res.send(autoCloseHtml);
};

// 贝宝IPN通知
exports.payPalNotify = function (request, response) {

    //You can also pass a settings object to the verify function:
    logger.info(request.body);
    const data = request.body;
    PayPalIPN.verify(data, {allow_sandbox: PayPalConfig.sandbox}, async (err, mes) => {
        //The library will attempt to verify test payments instead of blocking them
        if (err) {
            logger.error(err);
            response.status(500).send();
        } else {
            logger.info(mes);
            const tracking_id = data.tracking_id;
            // primary 收到钱即认为支付成功
            if (data['transaction[0].status'] === 'Completed') {
                // 分情况处理订单
                if (tracking_id.startsWith('DD')) { // 门票订单
                    if (!await DealPayPal.dealPayPalTicketOrderNotify(data, request)) {
                        return response.status(500).send();
                    }
                } else if (tracking_id.startsWith('M')) { // 会员订单
                    // 如果流水表插入失败返回fail，等待支付再通知
                    if (!await DealPayPal.dealWithMemberOrderByPayPal(data)) {
                        return response.status(500).send();
                    }
                } else if (tracking_id.startsWith('S')) { // 短信充值
                    data.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_SMS;
                    if (!await DealPayPal.dealPayPalSmsEmailOrderNotify(data, request)) {
                        return response.status(500).send();
                    }
                } else if (tracking_id.startsWith('E')) { // 邮件
                    data.transactionType = fixParams.ORDER_TYPE.ORDER_TYPE_EMAIL;
                    if (!await DealPayPal.dealPayPalSmsEmailOrderNotify(data, request)) {
                        return response.status(500).send();
                    }
                }
                return response.status(200).send();
            }
        }
    });
};

// PayPal支付同步通知
exports.payPalReturn = function (req, res, next) {
    res.contentType('text/html');
    logger.debug('PayPal支付同步通知 payPalReturn ', req.query);
    return res.send(autoCloseHtml);
};

// PayPal支付取消通知
exports.payPalCancel = function (req, res, next) {
    res.contentType('text/html');
    logger.debug('PayPal支付取消通知 payPalCancel ', req.query);
    return res.send('payPalCancel this page will close');
};

// 处理门票订单微信退款结果
async function __dealWxRefundTicketOrder(result) {
    try {

        logger.debug('--------------------微信退款接口被调用返回的正确结果---------------------------------------');
        logger.debug(result);
        logger.debug('--------------------微信退款接口被调用返回的正确结果---------------------------------------');

    } catch (err) {
        logger.error('__dealWxRefundTicketOrder ', err);
    }
}

// 门票订单的退款的微信请求参数
async function __makeWxRefundTicketOrderReqParams(req, res, next) {
    try {

        const body        = req.body;
        const orderNumber = body.orderNumber;
        const options     = body.options;// 参会者的签到码id数组
        const refundDesc  = body.refundDesc;// 退款原因

        // 获取订单信息
        const attributeNames = ['orderNumber', 'eventId', 'totalPrice', 'attendees', 'currencyType'];
        const orderInfo      = await Order.getOrderByOrderNum(orderNumber, attributeNames);
        if (_.isEmpty(orderInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('NotExists', 'orderNumber'),
            });
        }

        // todo 判断活动是否能进行退款

        // 获取事物表支付信息
        const transactionInfo = await Transaction.getTransactionByOrderId(orderNumber, ['paymentPlatformId']);
        if (_.isEmpty(transactionInfo)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('NotExists', 'transaction'),
            });
        }

        // 保存退款记录到退款表
        const refundOrderObj = {
            refundNumber         : myutil.getOrderNum('RDD'),
            refOrderNumber       : orderNumber,
            thirdPartyOrderNumber: transactionInfo.paymentPlatformId,
            totalPrice           : orderInfo.totalPrice,
            refundFee            : 0.01,
            refundDesc           : _.isUndefined(refundDesc) ? '' : refundDesc,
            currency             : orderInfo.currencyType,
            channel              : fixParams.REFUND_CHANNEL.REFUND_CHANNEL_WECHAT,
            type                 : fixParams.REFUND_TYPE.REFUND_TYPE_TICKET,
            status               : fixParams.REFUND_STATUS.REFUND_STATUS_APPLY,
            options              : options,
        };
        RefundOrder.add(refundOrderObj);

        // 返回微信需要的退款参数
        const reqObj = {
            transaction_id: refundOrderObj.thirdPartyOrderNumber,// 微信订单号
            out_refund_no : refundOrderObj.refundNumber,// 商户退款单号
            total_fee     : refundOrderObj.totalPrice * 100,// 订单金额,单位分且必须是整数
            refund_fee    : refundOrderObj.refundFee * 100,// 退款金额,单位分且必须是整数
            refund_desc   : refundOrderObj.refundDesc,// 退款原因
        };

        return reqObj;

    } catch (err) {
        logger.error('__makeWxRefundTicketOrderReqParams ', err);
        return {};
    }
}

// 微信-退款
exports.wxpayRefundOrder = async function (req, res, next) {
    try {
        const body        = req.body;
        const orderNumber = body.orderNumber;
        let reqParams     = {};

        // 分情况处理请求参数
        if (orderNumber.startsWith('DD')) { // 门票订单
            reqParams = await __makeWxRefundTicketOrderReqParams(req, res, next);
        }

        if (_.isEmpty(reqParams)) {
            return next({
                errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                responseText: req.__('Empty', 'reqParams'),
            });
        }

        const wxpay = WXPay({
            appid      : WxPayConfig.WX_APP_ID,
            mch_id     : WxPayConfig.WX_PARTNER_ID,
            partner_key: WxPayConfig.WX_PARTNER_KEY,
            pfx        : WxPayConfig.WX_APP_PFX,
        });

        logger.debug('--------------------微信退款接口被调用请求参数信息---------------------------------------');
        logger.debug(reqParams);
        logger.debug('--------------------微信退款接口被调用请求参数信息---------------------------------------');

        wxpay.refund(reqParams, async function (err, result) {

            logger.debug('--------------------微信退款接口被调用返回的错误信息---------------------------------------');
            logger.debug(err);
            logger.debug('--------------------微信退款接口被调用返回的错误信息---------------------------------------');
            logger.debug('--------------------微信退款接口被调用返回的正确结果---------------------------------------');
            logger.debug(result);
            logger.debug('--------------------微信退款接口被调用返回的正确结果---------------------------------------');

            if (err) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: err.message
                });
            }

            // 签名验证
            const isValidSign = DealWxPay.verifyWxSign(result, wxpay);
            if (!isValidSign) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: '非法操作,签名错误...'
                });
            }

            if (_.isEmpty(result)) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: '申请退款失败,请稍候再试...'
                });
            }

            if (result.return_msg !== 'OK') {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: result.return_msg
                });
            }

            var isSuccess = (result.return_code === 'SUCCESS')
                && (result.result_code === 'SUCCESS')
                && (!_.isEmpty(result.transaction_id))
                && (!_.isEmpty(result.refund_id))
                && (!_.isEmpty(result.refund_fee))
                && (!_.isEmpty(result.total_fee));

            if (!isSuccess) {
                return next({
                    errorCode   : errorCodes.ERR_INTERNAL_SERVER,
                    responseText: result.err_code_des
                });
            }

            return res.status(200).send(result);
        });

    } catch (err) {
        logger.error('wxpayRefundOrder', err);
        return next({
            errorCode: errorCodes.ERR_INTERNAL_SERVER, responseText: err.message
        });
    }
};