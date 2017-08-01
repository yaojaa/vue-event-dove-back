/**
路由函数映射 Controller
@author :lwp
@date:  :2017-07-07
@version : 0.1.0 
*/



const fs 				= require("fs");
let jwt           	= require('../services/auth');
const settings          = require("../conf/settings");
let jwtCheck      	= jwt({secret: settings.secret});



function bootController(app, file) {
	const name = file.replace('.js', '');
	const actions = require('../controllers/' + name);
	const mapping = actions["mapping"];
	Object.keys(actions).map(function(action){
		const fn = actions[action];
		if(typeof(fn) === "function") {
		  	if(a = mapping[action]) {
			  	switch(a.method) {
			  		case 'get':
						if(a.auth == true){
							app.get(a.url,jwtCheck,fn);
						}	
					  	else	
					  		app.get(a.url, fn);
						break;
			  		case 'post':
			  			if(a.auth == true)	app.post(a.url,auth,fn);
					  	else	
					  		app.post(a.url, fn);
							console.log("post " + a.url);
							break;
			  		case 'put':
							app.put(a.url, fn);
							console.log("put " + a.url);
							break;
			  		case 'delete':
							app.del(a.url, fn);
							console.log("delete " + a.url);
							break;
			  	}
		  	} else {
		  		console.log("WARNING: no mapping for " + action + " defined");
		  	}
		}
	});
}

module.exports = {
	bootControllers : function(app) {
	    fs.readdir(__dirname + '/../controllers', function(err, files){
	        if (err) throw err;
	        files.forEach(function(file){
	            //console.log("booting controller " + file);
	            if(file != '.DS_Store'&&file==='testController.js')
	            	bootController(app, file);
	        });
	        
	    });
	}
}


