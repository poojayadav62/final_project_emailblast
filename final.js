//********************************************************EmailBlast using node.js*******************************
//**********************import section************************
const winston = require('winston');
const winstonRotator = require('winston-daily-rotate-file');
var errorlog = require('./log/logger.js').errorlog;
var successlog = require('./log/logger.js').successlog;
var ob = require('./a.json');  
var events = require('events');
var eventEmitter = new events.EventEmitter();
var nodemailer = require('nodemailer');
var obj = require('./config.json');
var loc= require('./pathconfig.json');
var transporter = nodemailer.createTransport(obj);
var fs = require('fs')
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
		if(username==ob.user && password==ob.pass) // authentication
		{
			
			console.log("wating for new file:");
			fs.watch(loc.path, function (event, files)
			 {
			   if(event=='change')
					{
					var content = fs.readFileSync(loc.path+files);
						if(content.from!="" && content.to!="")
						{
						successlog.info("login success");
						var jsonContent = JSON.parse(content);
						sendmail_fun(files,jsonContent);
						}
						else
						{
							errorlog.error("address of sender or reciever missing");
							
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
			fs.writeFile("./Inbox/"+files, myJSON, function(err) {
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
			fs.writeFile("./Draft/"+files, myJSON, function(err) {
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


