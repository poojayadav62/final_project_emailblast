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
        console.log(err);
        return 1;
    }
	else 
	{
        var username = result.username;
        var password = result.password;
		login(username,password);
      
    }
});
//**********************End section************************

var ob = require('./a.json');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var nodemailer = require('nodemailer');
var obj = require('./config.json');
var winston = require('winston');
var transporter = nodemailer.createTransport(obj);
var fs = require('fs')

//**********************here watcher monitor  mailbox *****

 
 function login(username,password)
 {
		if(username==ob.user && password==ob.pass)
		{
			console.log("wating for new file:");
			fs.watch('./MailBox/', function (event, files)
			 {
			   if(event=='change')
					{
					var content = fs.readFileSync("./MailBox/"+files);
					var jsonContent = JSON.parse(content);
					sendmail_fun(files,jsonContent);
					}

		    });
		}
	 
 }
 //******************send mail function*********************
 
	    function sendmail_fun(files,jsonContent)
			{
				transporter.sendMail(jsonContent, function(error, info){
				if (error)
					{
					 console.log("error :"+error);
					 fail(files,jsonContent);
				    } 
				else
				    {
					console.log(files+" :start sending"); 
					success(files,jsonContent);
				    }
					});
			}
 
 //*****************************copy operation in inbox************************
 	var copyFileInInbox = function (files,jsonContent) {
			var myJSON = JSON.stringify(jsonContent);
			const fs = require('fs');
			fs.writeFile("./Inbox/"+files, myJSON, function(err) {
				if(err) 
				{
					return console.log(err);
				}
				console.log(files+" : is sended");
				console.log("wating for new mail:");
			}); 
		
			
		}
//************************copy operation in draft********************************		
	var copyFileInDraft = function (files,jsonContent) {
			var myJSON = JSON.stringify(jsonContent);
			const fs = require('fs');
			fs.writeFile("./Draft/"+files, myJSON, function(err) {
				if(err) {
					return console.log(err);
				}
        console.log("mail is save in draft");
			});
		  
		}
//**********************add listner  *********************************************

eventEmitter.on('copyFileInInbox', copyFileInInbox);
eventEmitter.on('copyFileInDraft', copyFileInDraft);

//**********************execute listner*******************************************

function success(files,jsonContent){
    eventEmitter.emit('copyFileInInbox',files,jsonContent);
}

function fail(files,jsonContent){
eventEmitter.emit('copyFileInDraft',files,jsonContent);
console.log("wating for new file:");
}
