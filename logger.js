const settings        = require("./conf/settings");
const winston         = require('winston');
const expressWinston  = require('express-winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment          = require('moment');
const dateFormat      = function () { return moment().format('YYYY-MM-DD HH:mm:ss:SSS'); };
const log4js          = require('log4js');

// log4js 设置
log4js.configure(
    {
        appenders: [
            {type: 'console'},
            {type: 'dateFile', filename: 'logs/eventDove.log', pattern: '.yyyy-MM-dd', alwaysIncludePattern: false}
        ]
    }
);
exports.logger = log4js.getLogger(settings.logger.categoryName);

// winstonLogger 设置
const infoTransport = new DailyRotateFile({
    name       : 'info-log',
    filename   : 'logs/info.log',
    timestamp  : dateFormat,
    level      : 'info',
    colorize   : true,
    maxsize    : 1024 * 1024 * 10,// 10M
    datePattern: '.yyyy-MM-dd'
});

const debugTransport = new DailyRotateFile({
    name       : 'debug-log',
    filename   : 'logs/debug.log',
    timestamp  : dateFormat,
    level      : 'debug',
    colorize   : true,
    maxsize    : 1024 * 1024 * 10,// 10M
    datePattern: '.yyyy-MM-dd'
});

const errorTransport = new DailyRotateFile({
    name       : 'error-log',
    filename   : 'logs/error.log',
    timestamp  : dateFormat,
    level      : 'error',
    colorize   : true,
    maxsize    : 1024 * 1024 * 10,// 10M
    datePattern: '.yyyy-MM-dd'
});

exports.winstonLogger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level   : settings.logger.level,
            json    : false,
            colorize: true
        }),
        infoTransport,
        debugTransport,
        errorTransport
    ]
});

// expressLogger 设置
const accessLoggerTransport = new DailyRotateFile({
    name       : 'access',
    filename   : 'logs/access.log',
    timestamp  : dateFormat,
    level      : 'info',
    colorize   : true,
    maxsize    : 1024 * 1024 * 10,// 10M
    datePattern: '.yyyy-MM-dd'
});

exports.expressLogger = expressWinston.logger({
    transports: [
        // new (winston.transports.Console)({
        //     level   : settings.logger.level,
        //     json    : true,
        //     colorize: true
        // }),
        accessLoggerTransport
    ]
});
