//********************************************************EmailBlast using node.js*******************************
//**********************import section************************
const winston = require('winston');
const winstonRotator = require('winston-daily-rotate-file');
var errorlog = require('./logger.js').errorlog;
var successlog = require('./logger.js').successlog;
var events = require('events');
var eventEmitter = new events.EventEmitter();
var nodemailer = require('nodemailer');
var cfg = require('./config.json');
var transporter = nodemailer.createTransport(cfg.gmails);
var fs = require('fs')
var empty = require('is-empty');
//***************Login section**********************

var prompt = require('prompt');
var prompt_attributes = [
    {
        name: 'username',
        validator: /^[a-zA-Z\s\-]+$/,
        warning: 'Username is not valid, it can only contains letters, spaces, or dashes'
    },
    {
        name: 'password',
	// hidden: true
    }
  
];

prompt.start();
prompt.get(prompt_attributes, function (err, result) {
    if (err) 
	{
       errorlog.error(err);
        return 1;
    }
	else 
	{
        var username = result.username;
        var password = result.password;
		login(username,password);
      
    }
});


//**********************here watcher monitor  mailbox *****

 
 function login(username,password)
 {
		if(username==cfg.login.user && password==cfg.login.pass) // authentication
		{
			successlog.info("login success");
			console.log("wating for new file:");
			fs.watch(cfg.path.Mpath, function (event, files)
			 {
			   if(event=='change')
					{
					var content = fs.readFileSync(cfg.path.Mpath+files);
						var jsonContent = JSON.parse(content)
						if(empty(jsonContent))
						{
						errorlog.error("file is blank");
						}
					
						else if(empty(jsonContent.to))
						{
						errorlog.error("reciever not found");
						}
						else
						{
							sendmail_fun(files,jsonContent);	
							
						}
					}

		    });
		}
	 
 }
 //******************send mail function*********************
 
	  var sendMail= function(files,jsonContent)
			{
				transporter.sendMail(jsonContent, function(error, info){
				if (error)
					{
 					 errorlog.error(error);
					 fail(files,jsonContent);
				    } 
				else
				    {
					successlog.info("Success :mail is start sending");
					success(files,jsonContent);
				    }
					});
			}
 
 //*****************************copy operation in inbox************************
 
 	var copyFileInInbox = function (files,jsonContent) {
			var myJSON = JSON.stringify(jsonContent);
			//const fs = require('fs');
			fs.writeFile(cfg.path.Ipath+files, myJSON, function(err) {
				if(err) 
				{
					return errorlog.error(err);
				}
				successlog.info("mail is sended");
				successlog.info("wating for new mail:");
			}); 
		
			
		}
//************************copy operation in draft********************************	
	
	var copyFileInDraft = function (files,jsonContent) {
			var myJSON = JSON.stringify(jsonContent);
			//const fs = require('fs');
			fs.writeFile(cfg.path.Dpath+files, myJSON, function(err) {
				if(err) {
					return errorlog.error("error:"+err);
				}
				
                successlog.info("mail is save in draft");
				successlog.info("wating for new mail:");
			});
		  
		}
//**********************add listner  *********************************************
eventEmitter.on('sendMail', sendMail);
eventEmitter.on('copyFileInInbox', copyFileInInbox);
eventEmitter.on('copyFileInDraft', copyFileInDraft);


//**********************execute listner*******************************************
function sendmail_fun(files,jsonContent){
  eventEmitter.emit('sendMail',files,jsonContent);	
}


function success(files,jsonContent){
    eventEmitter.emit('copyFileInInbox',files,jsonContent);
}

function fail(files,jsonContent){
eventEmitter.emit('copyFileInDraft',files,jsonContent);
}


