#!/usr/bin/env node
'use strict';
const http              = require('http');
const https             = require('https');
const fs                = require('fs');
const express           = require('express');
const bodyParser        = require('body-parser');
const connectMultiparty = require('connect-multiparty');
const cors              = require('cors');
const cookieParser      = require('cookie-parser');
const i18n              = require('i18n');
const _                 = require('underscore');
const moment            = require('moment');
const program           = require("commander");
const expressValidator  = require('express-validator');
const app               = express();
const Router            = require("./router");
const settings          = require("./conf/settings");
const myutil            = require('./util/util.js');
const privateKey        = fs.readFileSync('./conf/private.pem', 'utf8');
const certificate       = fs.readFileSync('./conf/file.crt', 'utf8');
const credentials       = {key: privateKey, cert: certificate};
const httpServer        = http.createServer(app);
const httpsServer       = https.createServer(credentials, app);
const loggerSettings    = require('./logger');
const logger            = loggerSettings.winstonLogger;
app.use(loggerSettings.expressLogger);// 日志设置
// 多语设置
i18n.configure({
    locales      : ['en', 'zhCn'],
    cookie       : settings.localeCookieName,
    defaultLocale: 'zhCn',
    directory    : __dirname + '/views/locale',  // i18n 翻译文件目录
    updateFiles  : false,
    indent       : "\t",
    extension    : '.json'
});
app.use(i18n.init);
app.use(cookieParser(settings.secret));
app.use(myutil.setLocale);
app.use('/public', express.static('./public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: "20480kb"}));
app.use(expressValidator()); // this line must be immediately after any of the bodyParser middlewares!
app.use(connectMultiparty());
app.use(cors());
app.use(function (req, res, next) {
    res.contentType('application/json');
    next();
});
const coredataService = require('./services/coredata');
require("./services/wechat/app")(app);
app.use('/', Router);
// 启动处理程序
if (process.env.NODE_ENV === "production") {
    require("./process/audit.js");// EventDove-Audit
    require("./process/queue.js");// EventDove-Queue
}
// 启动处理程序
// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function (err) {
    // handle the error safely
    logger.error("uncaught error:", err);
});
coredataService.init(program, function (refdata) {
    const time = moment().format('YYYY-MM-DD HH:mm');
    httpServer.listen(settings.port, function () {
        console.log('HTTP server listening on %d pid', settings.port, process.pid, time);
    });
    httpsServer.listen(settings.httpsPort, function () {
        console.log('HTTPS server listening on %d pid', settings.httpsPort, process.pid, time);
    });
});
// 保持这个middleware放在最后
app.use(function (err, req, res, next) {
    logger.error('Error happened!! ', err);
    const statusCode = err.statusCode || 500;
    delete err.statusCode;
    res.status(statusCode).send(err);
});
module.exports = app;