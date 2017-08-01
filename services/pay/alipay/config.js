/**
 * Created by Henry on 2017/3/15.
 */


// const AlipayConfig = {
//     partner: '2088302748034870',
//     key: '7qn5oq71de9jnqjo0faalji3yu2hcu8i',
//     seller_email: 'jchang@hyzing.com',
//     host: 'http://qa.www.eventdove.com/api',
//     notify_url: '/pay/alipayNotify',
//     return_url: '/pay/alipayDirectPayReturn',
//     input_charset: 'utf-8',
//     sign_type: 'MD5',
//     alipay_gateway: 'https://mapi.alipay.com/gateway.do?',
//     https_verify_url: 'https://mapi.alipay.com/gateway.do?service=notify_verify&'
// };

const AlipayConfig = {
    partner: '2088701311093474',
    key: 'e5s0y9aalbl44ec92agolc4t361k9o9r',
    seller_email: 'weipeng_wu@eventown.com.cn',
    host: 'http://qa.www.eventdove.com/api',
    notify_url: '/pay/alipayNotify',
    return_url: '/pay/alipayDirectPayReturn',
    input_charset: 'utf-8',
    sign_type: 'MD5',
    alipay_gateway: 'https://mapi.alipay.com/gateway.do?',
    https_verify_url: 'https://mapi.alipay.com/gateway.do?service=notify_verify&'
};

exports.AlipayConfig = AlipayConfig;
