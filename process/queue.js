const Promise        = require('bluebird');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Queue          = require('../util/queue');
const Event          = require('../model/event');
const Order          = require('../model/order');
const Notice         = require('../model/notice');
const RabbitMQConfig = require("../conf/settings").RabbitMQConfig;

// 处理队列中的消息
(async function processQueue() {

    logger.info('processQueue has been start.');

    // 活动相关队列
    const eventDelayedExchange = await Queue.createDelayedExchange(Event.exchangeName, RabbitMQConfig.connUrl);

    // 完成活动
    Queue.addConsumer(eventDelayedExchange, Event.queueName, Event.exchangeName, Event.consumeFinishedEvent);

    // -------------------------------------------------------------------------------------------------------------------

    // 订单相关队列
    const orderDelayedExchange = await Queue.createDelayedExchange(Order.exchangeName, RabbitMQConfig.connUrl);

    // 订单超时未支付
    Queue.addConsumer(orderDelayedExchange, Order.queueName, Order.exchangeName, Order.consumeOrderTimeOut);

    // 邮件短信相关队列
    const noticeDelayedExchange = await Queue.createDelayedExchange(Notice.exchangeName, RabbitMQConfig.connUrl);

    // 完成活动
    Queue.addConsumer(noticeDelayedExchange, Notice.queueName, Notice.exchangeName, Notice.consumeFinishedNotice);

})();

