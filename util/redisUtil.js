const redisConfig = require('../conf/settings').redisConfig;
const cacheFlag = require('../conf/settings').CACHE_FLAG;
const redis = require('redis');
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClinet = redis.createClient(redisConfig.PORT, redisConfig.HOST);
exports.redisClinet = redisClinet;

redisClinet.on('ready', () => {
    logger.info('Redis client is ready.');
});

redisClinet.on('error', (err) => {
    logger.error(err);
});

exports.get = function(key) {
    if (cacheFlag) {
        return redisClinet.getAsync(key);
    }
    return null;
}

exports.sismember = function(key,value) {
    if (cacheFlag) {
        return redisClinet.sismemberAsync(key,value);
    }
    return 0;
}

exports.hgetall = function(key, member) {
    if (cacheFlag) {
        return redisClinet.hgetall(key, member);
    }
    return null;
}

/**
redisClinet.getAsync("string key").then(function(res) {
    logger.info(res); // => 'bar'
});

redisClinet.getAsync("xxx").then(function(res) {
    logger.info(res); // => 'bar'
});
*/
/*redisClinet.hset("hash key", "hashtest 1", "some value", redis.print);
redisClinet.hset(["hash key", "hashtest 2", "some other value"], redis.print);
redisClinet.hkeys("hash key", function (err, replies) {
    logger.info(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        logger.info("    " + i + ": " + reply);
    });
    redisClinet.quit();
});*/
