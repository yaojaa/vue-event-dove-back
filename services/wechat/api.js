/**
微信service
@class 
@author :lwp
@date:  :2017-07-10
@version : 0.1.0 
*/

const log = require('../../logger.js');
const fs = require('fs');
const settings = require("../../conf/settings");
const wxConfig = require('./wechatConf').wxConfig;
const errorCodes = require('../../util/errorCodes.js').ErrorCodes;
const wxPayConfig = require('./wechatConf').wxPayConfig;
const API = require('co-wechat-api');
const api = new API(wxConfig.appid,wxConfig.secret);
const OAuth = require('co-wechat-oauth');
const client = new OAuth(wxConfig.appid,wxConfig.secret);

let wxTicket = require('./wechatTicket.js');

//暂未用 
// const wechatPay = require('tenpay');
// const payApi = new wechatPay(wxPayConfig);


//相关数据表
const orderDB = require('../../model/order');
const eventDB = require('../../model/event');


let replyText=wxConfig.replyText; //自动回复语
//关注事件
let eventkey=''; //扫码关注带的数据
exports.subscribe=async function(req){

	const wxMsg=req.body;
	const openid=req.body.FromUserName;
	if (wxMsg.EventKey) { //通过带参二维码进来的
		log.logger.info('用户扫码关注:openid='+openid+"参数："+wxMsg.EventKey);
		const s=wxMsg.EventKey.split('qrscene_')[1];
		if(s){
			eventkey=s;
		}
		const sign=eventkey.substring(0,2);
		if(sign=='MP'||sign=='DD'){   
			getQrcodeInfo(req,eventkey);
	        return ({datas:replyText});	
		}else{
			return ({datas:replyText});
		}
	}else{
		log.logger.info('用户正常关注:openid='+openid);
		return ({datas:replyText});
	}
	//let user=await exports.getUserInfoByOpenId(openid);
};

//取消关注事件
exports.unsubscribe=function(req){
	const openid=req.body.FromUserName;
	

    return;

};


//根据openid获取用户信息
exports.getUserInfoByOpenId = function(openId) {
	try{
		let result= api.getUser({openid:openId});
		return result;
	}catch(err){
		return err;
	}
};

//保存用户信息
exports.saveWXuser = function(wxuser,req) {
	let sex = "";
    if (wxuser.sex == "1") {
        sex = "男";
    }
    if (wxuser.sex == "2") {
        sex = "女";
    }
    if (wxuser.sex == "0") {
        sex = "未知";
    }
 	const wxdata = {
        "wxopenId": wxuser.openid,
        "nickName": wxuser.nickname,
        "headimgurl": wxuser.headimgurl,
        "province": wxuser.province,
        "city": wxuser.city,
        "source": "微信",
        "sex": sex,
        "status":'已关注',
        "phone":'',
        "realName":''
    };

    return;
   
};

//处理文本消息
exports.doTextMsg=function(req){
	const openid=req.body.FromUserName;
	const content=req.body.Content;
	
	return ({datas:'亲，您想表达什么呢~'});
	
};

//处理点击事件
exports.doClickMsg=function(req){
	const openid=req.body.FromUserName;
	const EventKey=req.body.EventKey;
	
	if(EventKey=='key_104'){
		replyText='<a href="">点击查看</a>';
        return ({datas:'亲，您想表达什么呢~'});
	}else{
		return ({datas:replyText});
	}


};




//发消息
exports.sendMessage=async function(type,openids,content){
	if(type=='text'){
		//log.logger.info('发消息给这些用户：'+JSON.stringify(openids));
		var count=0;
		for(var i=0;i<openids.length;i++){
			(function(ii){
				//console.log("发送给:"+openids[ii])
				const result = api.sendText(openids[ii], content);
				count++;
				if(count==openids.length){
					if(result.errmsg=='ok'){
						return ({datas:'发送成功',resultCode:'0'});
					}else{
						return ({datas:result.errmsg,resultCode:'99'});
					}
				}

			})(i);
		}
	}else if(type=='imgText'){     //图文
		const result =await api.sendNews(openids, content);
		if(result.errcode==0){
			log.logger.info('发送图文消息to:openid='+openids+"result："+result.errmsg);
			return ({datas:'发送成功',resultCode:'0'});
		}else{	
			return ({datas:result.errmsg,resultCode:'99'});
		}

    }
	
};


//创建二维码
exports.createQRCode =async function(params) {
	const data=params.data;
	const type=params.type;
	const expire=params.expire;
	if(type=='0'){
		try{
			const result =await api.createTmpQRCode(data,expire);
			//生成显示二维码链接
			const  url=api.showQRCodeURL(result.ticket);
			return ({resultCode:'0',qrCode:url});
		}catch(err){
			return ({resultCode:'99',datas:err.name})
		}

	}else{
		try{
			const result =await api.createLimitQRCode(data);
			//生成显示二维码链接
			const  url=api.showQRCodeURL(result.ticket);
			return ({resultCode:'0',qrCode:url});
		}catch(err){
			return ({resultCode:'99',datas:err.name})
		}
		
	}
};

//生成显示二维码链接
exports.showQRCodeURL = function(titck) {
	const url=api.showQRCodeURL(titck);
	return url;
};


//获取二维码信息的数据处理
exports.getQrcodeInfo =async function(req,data) {
	const openid = req.body.FromUserName;  //openid
	const sign=data.substring(0,2);
	if(sign=='MP'){		//门票信息
		const orderNumber=data.split('-')[1]; //订单号
  	 	const attendeeId=data.split('-')[2]; //参会者id
  	 	const params={
	    	wxopenId:openid,
	    	orderNumber:orderNumber,
	    	attendeeId:attendeeId

	    }

	    let dataInfo =await orderDB.attendeesGetTicket(params);
	    //console.log(dataInfo.datas.id)
	    if(dataInfo.resultCode=='0'){
	    	const content=[{
		    	title:dataInfo.datas.title,
			    description:"",
			    url:settings.serverUrl+"/electronicTicket/"+attendeeId+"/"+orderNumber,
			    picurl:"http://pic.eventdove.com/FnJTZ04MOLIuacErQhIi5qrOU5eu"
		    }];
		    //发送图文
		    const result = await exports.sendMessage('imgText',openid,content);
		    return result;

	    }else{
	    	return ({resultCode:'99',datas:dataInfo.datas});
	    }
	}else if(sign=='DD'){  //订单信息
		const orderNumber=data.split('-')[1]; //订单号
		const orderInfo =await orderDB.getOrderByOrderNum(orderNumber,['id','eventId']);
        orderDB.updateOrderById(orderInfo.id,{'wxopenId':openid});   //更新订单二维码
        const eventInfo = await eventDB.getEventById(orderInfo.eventId,['title']);
        const content=[{
	    	title:eventInfo.title,
		    description:"",
		    url:settings.serverUrl+"/AllelectronicTicket/"+orderNumber,
		    picurl:"http://pic.eventdove.com/FnJTZ04MOLIuacErQhIi5qrOU5eu"
	    }];
	    //发送图文
	    const result = await exports.sendMessage('imgText',openid,content);
	    return result;
	}else{
		return ({resultCode:'99',datas:replyText});
	}

}

//菜单操作
exports.wxMenu =async function(req,menu){
	try{
        let result = await api.createMenu(menu);
        return ({resultCode:'0',datas:'ok'});
    }catch(err){
        return ({resultCode:'99',datas:err});
    }
}


//微信网页授权
exports.wxAuth=async function(req,res){	
	const originalUrl 	= req.param('url');
	const authUrl 		= settings.serverUrl+originalUrl;
	const state  		= req.param('state')||'state'; //携带参数，微信授权重定向后会返回
	try{
		//const url = await client.getAuthorizeURLForWebsite(authUrl);
		const  wxUrl 	= client.getAuthorizeURL(authUrl, state, 'snsapi_base');	//静默授权 snsapi_userinfo：获取用户信息
		return wxUrl;
	}catch(err){
		return err;
	}
}

//获取Openid和AccessToken
exports.getAccessToken=async function(code){	

	try{
		const token = await client.getAccessToken(code);
	    const accessToken = token.data.access_token;
	  	const openid = token.data.openid;
	  	return ({openid:openid,accessToken:accessToken});
	}catch(err){
		return err;
	}
	
	
}






