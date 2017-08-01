/**
微信模块 Controller
@class 
@author :lwp
@date:  :2016-07-07
@version : 0.1.0 
*/
const log = require('../logger.js');
const _           = require('lodash');
const errorCodes = require('../util/errorCodes.js').ErrorCodes;
const fixParams     = require('../util/fixParams');
const wxConfig = require('../services/wechat/wechatConf').wxConfig;
const service=require('../services/wechat/api.js');


const attendeeController   = require('./attendeeController');
const orderDB   = require('../model/order.js');

const settings    = require("../conf/settings");
const loggerSettings = require('../logger');
const logger         = loggerSettings.winstonLogger;


//微信验证服务器
function wxIndex(req,res){
    const signature = req.param("signature");
    const timestamp = req.param("timestamp");
    const nonce = req.param("nonce");
    const echostr = req.param("echostr");

    //记录日志到数据库
    const logsInfo = {
        "name": "微信公众平台交易信息",
        "source": "weixinActivity->WxIndex",
        "level": "信息",
        "category": "交易信息", //错误信息
        "keywords": "微信公众平台",
        "computer": req.connection.remoteAddress,
        "eventData": "微信平台GET请求;/m/wx",
        "content": "signature=" + signature + ";timestamp=" + timestamp + ";nonce=" + nonce + ";echostr=" + echostr
    };
    
    //这里可以记录日志
    log.logger.info('Class:weixinController;Function:WxIndex;InfoMsg:微信平台返回参数:');
    log.logger.info('Class:weixinController;Function:WxIndex;InfoMsg:signature=' + signature);
    log.logger.info('Class:weixinController;Function:WxIndex;InfoMsg:timestamp=' + timestamp);
    log.logger.info('Class:weixinController;Function:WxIndex;InfoMsg:nonce=' + nonce);
    log.logger.info('Class:weixinController;Function:WxIndex;InfoMsg:echostr=' + echostr);
    res.send(echostr);
       
}

/**
微信主题消息处理
@private
 {
  ToUserName: '开发者微信号',
  FromUserName: '发送方帐号（一个OpenID）',
  CreateTime: '消息创建时间 （整型）',
  MsgType: '消息类型', text(文本)， event(事件)(Event:CLICK,VIEW,subscribe，unsubscribe),voice（语音）[Recognition:语音中文]，
  location(地理位置)，image(图片)
  Content: '文本消息内容',
  MsgId: '消息id，64位整型' 
  }
*/
async function wxData(req,res){
    const wxMsg=req.body;
    const msgType=wxMsg.MsgType;  //消息类型
    const FromUserName=wxMsg.FromUserName; //微信openid
    console.log(wxMsg);
    log.logger.info('Class:weixinController;Function:WxData;InfoMsg:wxdata post Start.');
    log.logger.info('Class:weixinController;Function:WxData;InfoMsg:req.body=' + req.body);
    let replyText=wxConfig.replyText;//自动回复语
    
    if(msgType=='text'){
            const content=wxMsg.Content;  
            const result=await service.doTextMsg(req);
            res.reply(result.datas);

    }else if(msgType=='event'){
            if(wxMsg.Event=='CLICK'){ //点击事件
                const result=service.doClickMsg(req);
                res.reply(result.datas);
               
            }else if(wxMsg.Event=='subscribe'){
                const result= await service.subscribe(req); //关注事件
                res.reply(result.datas);                    
            }else if(wxMsg.Event=='unsubscribe'){
                log.logger.info('用户取消关注,openid：'+wxMsg.FromUserName);
                //const result=service.unsubscribe(req);    //取消关注事件
                res.reply(replyText);
            }else if(wxMsg.Event=='VIEW'){
                res.reply(replyText);
            }else if(wxMsg.Event=='SCAN'){  //扫码
                log.logger.info('用已关注，扫码进来,openid：'+wxMsg.FromUserName);
                //关注了 扫描进来
                let data=wxMsg.EventKey;   
                const result = await service.getQrcodeInfo(req,data);
                if(result.resultCode==0){
                    res.reply();
                }else{
                    res.reply(result.datas);
                }
                                  
            }else if(wxMsg.Event=='ShakearoundUserShake'){
                res.reply();
            }else if(wxMsg.Event=='scancode_push'){
                res.reply();
            }else if(wxMsg.Event=='LOCATION'){
                res.reply();
            }
        
    }else if(msgType=='voice'){
            res.reply(replyText);
    }else if(msgType=='location'){
            res.reply(replyText);
    }else if(msgType=='image'){
            res.reply(replyText);
    }else{
            res.reply(replyText);
    }
}

//生成二维码
async function cQrcode(req,res,next){
    const name = req.param('name');   //名称  判断生成谁的二维码信息
    let params={
        type:'0',       ////0： 临时， 1：永久
        expire:'3600',  //有效时间（type为0时） 秒
        data:''         //二维码数据
    }
    if(name=='ticket'){     //参会者电子票 
        const orderNumber=req.body.orderNumber;     //订单号
        const attendeeId=req.body.attendeeId;   //参会者id
        params.type='1';
        params.data='MP-'+orderNumber+'-'+attendeeId;
    }else if(name=="order"){
        const orderNumber=req.body.orderNumber;     //订单号
        params.type='1';
        params.data='DD-'+orderNumber;
    }else{
        return res.send('参数有误');
    }

    const result = await  service.createQRCode(params);  

    if(result.resultCode=='0'){
        req.body.qrCode=result.qrCode;
        if(name=='ticket'){
            attendeeController.updateAttendeeById(req,res,next);        //更新电子票二维码
        }else if(name=='order'){
            const orderInfo =await orderDB.getOrderByOrderNum(req.body.orderNumber,['id']);
            orderDB.updateOrderById(orderInfo.id,{'qrCode':result.qrCode});   //更新订单二维码
        }
        
        res.send({resultCode:'0',qrCode:result.qrCode});
    }else{
        res.send({resultCode:'99',qrCode:'',errMsg:result.datas});
    }




}

//菜单操作
async function wxMenu(req,res,next){
    const menu={
        "button":[
            {
                "type": "view", 
                "name": "找活动", 
                "key": "key_101", 
                "url": "http://qa.www.eventdove.com/",
            },
            {
                "name": "个人中心",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "我的账户",
                        "url": "http://qa.www.eventdove.com/account",
                    }
                ]
            }

        ]
    }
    try{
        let result = await service.wxMenu(req,menu);
        res.send(result)
    }catch(err){
        res.send(err)
    }


}

//微信网页授权
async function wxAuth(req,res,next){
    const code=req.param('code')||'';  //授权码
    const originalUrl=req.param('url');  //授权页面
    //var authurl="/wx/oauth?code=001zJAQ914EDEU1zrlR91cMzQ91zJAQV&state=";
    if(code==''){
        log.logger.info(originalUrl+'未授权,去生成授权url');
        if (_.isUndefined(originalUrl)) {
            return next({
                errorCode   : errorCodes.ERR_INVALID_PARAMETERS,
                responseText: req.__("Empty", "url")
            });
        }
        try{
            const authurl = await service.wxAuth(req,res);
            log.logger.info('授权url：'+authurl);
            return res.status(200).send({authurl:authurl});
        }catch(err){
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: err
            });
        }
    }else{
        log.logger.info(originalUrl+'已授权,通过code换取网页授权access_token');
        try{
            const result = await service.getAccessToken(code);
            log.logger.info('授权结果'); 
            log.logger.info(result); 
            return res.status(200).send({data:result});
        }catch(err){
            return next({
                errorCode: errorCodes.ERR_INVALID_PARAMETERS, responseText: err
            });
        }
        
    }
}



exports.wxIndex               = wxIndex;
exports.wxData                = wxData;
exports.wxMenu                = wxMenu;
exports.wxAuth                = wxAuth;
exports.cQrcode               = cQrcode;




