/**
 * Created by Henry on 2017/3/29.
 */
const Paypal       = require('paypal-adaptive');
const assert       = require('assert');
const loggerSettings = require('../../../logger');
const logger         = loggerSettings.winstonLogger;
const PayPalConfig = require('./config').PayPalConfig;

const paypalSdk = new Paypal({
    userId   : PayPalConfig.userId,
    password : PayPalConfig.password,
    signature: PayPalConfig.signature,
    sandbox  : PayPalConfig.sandbox,
    appId : PayPalConfig.appId
});

/**
 * 进行分润的PayPal支付
 * https://developer.paypal.com/docs/classic/api/adaptive-payments/Pay_API_Operation/
 * @param data
 * {
 *      orderId: 会鸽系统订单号
 *      memo: 主题，文字描述,
 *      email: 主办方贝宝邮箱账号,
 *      amount: 总费用,
 *      eventdoveFee: 会鸽服务费
 * }
 */
exports.sharePay = function (data) {
    assert.ok(data.orderId && data.memo && data.email && data.amount && data.eventdoveFee);
    const payload = {
        requestEnvelope   : {errorLanguage: 'en_US'},
        actionType        : 'PAY',
        currencyCode      : 'USD',
        trackingId        : data.orderId,
        feesPayer         : 'PRIMARYRECEIVER',
        charset           : 'utf8',
        memo              : data.memo,
        returnUrl         : PayPalConfig.returnUrl,
        cancelUrl         : PayPalConfig.cancelUrl,
        ipnNotificationUrl: PayPalConfig.ipnNotificationUrl,
        receiverList      : {
            receiver: [
                {
                    email    : data.email,
                    amount   : data.amount,
                    invoiceId: data.orderId,
                    primary  : 'true'
                },
                {
                    email    : PayPalConfig.receiver,
                    amount   : data.eventdoveFee,
                    invoiceId: data.orderId,
                    primary  : 'false'
                }
            ]
        }
    };

    return new Promise(function (resolve, reject) {
        paypalSdk.pay(payload, function (err, response) {
            if (err) {
                logger.error(err);
                logger.error(response);
                reject(err);
            } else {
                logger.info(response);
                resolve(response.paymentApprovalUrl);
            }
        });
    })
};

/**
 * 不需要进行分润的PayPal支付
 * @param data
 * {
 *      orderId: 订单号
 *      memo: 主题，文字描述,
 *      email: 需要收款的帐号,
 *      amount: 总费用,
 * }
 */
exports.directPay = function (data) {
    assert.ok(data.orderId && data.memo && data.email && data.amount);
    const payload = {
        requestEnvelope   : {errorLanguage: 'en_US'},
        actionType        : 'PAY',
        currencyCode      : 'USD',
        trackingId        : data.orderId,
        feesPayer         : 'EACHRECEIVER',
        charset           : 'utf8',
        memo              : data.memo,
        returnUrl         : PayPalConfig.returnUrl,
        cancelUrl         : PayPalConfig.cancelUrl,
        ipnNotificationUrl: PayPalConfig.ipnNotificationUrl,
        receiverList      : {
            receiver: [
                {
                    email    : data.email,
                    amount   : data.amount,
                    invoiceId: data.orderId,
                }
            ]
        }
    };

    return new Promise(function (resolve, reject) {
        paypalSdk.pay(payload, function (err, response) {
            if (err) {
                logger.error(err);
                logger.error(response);
                reject(err);
            } else {
                logger.info(response);
                resolve(response.paymentApprovalUrl);
            }
        });
    })
};


/*var payload = {
    requestEnvelope   : {errorLanguage: 'en_US'},
    actionType        : 'PAY',
    currencyCode      : 'USD',
    // trackingId: 'Dovetest-001sadfasdfeafd',
    trackingId        : 'Dovetest-' + Math.floor(100000 + (Math.random() * 100000)),
    invoiceId         : 'Invoice-' + Math.floor(100000 + (Math.random() * 100000)),
    feesPayer         : 'PRIMARYRECEIVER',
    charset           : 'utf8',
    subject           : '主题-------',
    memo              : '备忘录-------',
    cancelUrl         : 'http://dovetest.eatuo.com:9000/cancel',
    returnUrl         : 'http://dovetest.eatuo.com:9000/success',
    ipnNotificationUrl: 'https://henry.eatuo.com/pay/payPalNotify',
    receiverList      : {
        receiver: [
            {
                email    : 'usa@eventown.com',
                amount   : '10.00',
                primary  : 'true',
                // invoiceId: 'Invoice-primary' + Math.floor(100000 + (Math.random() * 100000)),
                invoiceId: 'Invoice-primary'
            },
            {
                email    : 'caiwu-facilitator@eventown.com',
                amount   : '0.99',
                primary  : 'false',
                // invoiceId: 'Invoice-secondary' + Math.floor(100000 + (Math.random() * 100000)),
                invoiceId: 'Invoice-primary',
            }
        ]
    }
};

logger.info(payload);

paypalSdk.pay(payload, function (err, response) {
    if (err) {
        logger.error(err);
        logger.error(response);
    } else {
        logger.info(response);
        // But also a paymentApprovalUrl, so you can redirect the sender to checkout easily
        logger.info('Redirect to %s', response.paymentApprovalUrl);
    }
});*/

