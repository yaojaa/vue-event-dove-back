const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const Promise        = require('bluebird');
const amqp           = require('amqplib');
const RabbitMQConfig = require("../conf/settings").RabbitMQConfig;

// 队列工具类

/**
 * 建立RabbitMQ连接,创建对应的exchange
 * @param _exchangeName
 * @param connUrl
 * @returns {Promise.<*>}
 */
exports.createDelayedExchange = async function (_exchangeName, connUrl) {
    try {
        connUrl       = connUrl || RabbitMQConfig.connUrl;
        const open    = await amqp.connect(connUrl);
        const channel = await open.createChannel();
        const args    = {durable: true, arguments: {'x-delayed-type': 'direct'}};
        await channel.assertExchange(_exchangeName, 'x-delayed-message', args);
        return channel;
    } catch (err) {
        logger.error('createDelayedExchange创建RabbitMQ连接失败了...');
        return null;
    }
};

/**
 * 添加生产者
 * @param _channel
 * @param _routingKey
 * @param _exchangeName
 * @param payload 发布的消息内容,是一个字符串
 * @param _options
 * @returns {Promise.<void>}
 */
exports.addPublisher = async function (_channel, _routingKey, _exchangeName, _payload, _options) {
    try {
        await _channel.publish(_exchangeName, _routingKey, new Buffer(JSON.stringify(_payload)), _options);
        _channel.close();
    } catch (err) {
        logger.error('addPublisher失败了,原因是创建RabbitMQ连接失败了...');
    }
};

/**
 * 添加消费者
 * @param _channel
 * @param _queueName
 * @param _exchangeName
 * @param handler
 * @returns {Promise.<void>}
 */
exports.addConsumer = async function (_channel, _queueName, _exchangeName, handler) {
    try {
        await _channel.assertQueue(_queueName);
        await _channel.bindQueue(_queueName, _exchangeName, _queueName);
        _channel.consume(_queueName, async function (msg) {
            if (msg !== null) {
                handler(msg, _channel);
            }
        });
    } catch (err) {
        logger.error('addConsumer失败了,原因是创建RabbitMQ连接失败了...');
    }
};
