var _          = require('lodash');
var thinky     = require('../util/thinky.js');
var st         = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;
var errorCodes = require('../util/errorCodes.js').ErrorCodes;
var https      = require('https');
var util       = require('util');
var url        = require('url');
var querystring = require('querystring');
var iconv      = require("iconv-lite");

// htts 的 get 请求
async function https_get_request(url) {
    var promise = new Promise(function(resolve, reject) {
        https.get(url, function (res) {
            var datas = [];
            var size = 0;
            res.on('data', function (data) {
                datas.push(data);
                size += data.length;
                //process.stdout.write(data);
            });
            res.on("end", function () {
                var buff = Buffer.concat(datas, size);
                var result = iconv.decode(buff, "utf8");//转码
                // var result = buff.toString();//不需要转编码,直接tostring
                resolve(result);
            });
        }).on("error", function (err) {
            Logger.error(err.stack);
            reject(null);
        });
    });
    return promise;
}

exports.htts_get = https_get_request;

// htts 的 post 请求
async function https_post_request(reqUrl,data) {
    var promise = new Promise(function(resolve, reject) {
        var post_option = url.parse(reqUrl);
        post_option.method = "POST";
        post_option.port = 443;
        var post_data = querystring.stringify(data);
        post_option.headers = {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : post_data.length
        };
        var post_req = https.request(post_option,function(res){
            res.setEncoding('utf8');
            res.on('data',function(chunk){
                // console.log('------chunk: '+chunk);
                resolve(chunk);
            });
        });
        post_req.write(post_data);
        post_req.end();
    });
    return promise;
}
exports.htts_post = https_post_request;
