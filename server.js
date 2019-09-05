var express = require('express');
var app = express();
var http = require('http').createServer(app);
const request = require('request');
const cookieParser = require('cookie-parser');
const formidable = require('formidable');
const util = require('util');
var io = require('socket.io')(http);

const translate = require('./server/GoogleTranslate.js');

app.use(express.static('client'))
app.use(cookieParser());

http.listen(3000);
process.stdout.write('\033c') //Clear console
console.log("Server started");

let sockets = new Map;

let requestDomain = "";

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/client/index.html");
});

app.get("/*", (req, res) => {
	console.log(req.url);
	
	if (!req.query.ludsocketid) res.end();
	else {
	  	getURL(requestDomain + req.url, data => {
	  		sockets.get(req.query.ludsocketid).send(JSON.stringify({
	  			type: "html",
	  			data: data,
	  		}))
	  	});
  	}
});

/*app.post("/*", (req, res) => {
	console.log(req.url);
	console.log(req.cookie);
	console.log(req.query.ludsocketid);

	let data = {};

    let form = new formidable.IncomingForm();
 
    form.parse(req, (err, fields, files) => {
      	console.log(util.inspect({fields: fields, files: files}));
      	postURL(requestDomain + req.url, {form: fields}, data => {
      		sockets.get(req.query.ludsocketid).send(JSON.stringify({
      			type: "html",
      			data: data,
      		}))
      	});
    });
});*/

io.on('connection', socket => {
	console.log('A user has connected');

	let id = createId();
	sockets.set(id, socket);

	socket.send(JSON.stringify({
		type: "id",
		id: id
	}));

  	socket.on('disconnect', () => {
    	console.log('A user has disconnected');

    	sockets.delete(id);
  	});

  	socket.on('message', msg => {
    	console.log('message: ' + msg);
    	const data = JSON.parse(msg);

    	switch(data.type) {
    		case "url-request": {
    			if (data.url.includes("youtube.com/watch?v=") || (data.url.includes("youtu.be/") && !data.url.includes("watch"))) {
    				console.log("DEBUG:", data.url);
    				let youtubeDomain = data.url.includes("youtube.com/watch?v=") ? "youtu.be" : "youtube.com";
    				let id = data.url.split(youtubeDomain != "youtube.com" ? "/watch?v=" : "://youtu.be/")[1];
    				data.url = "https://youtube.com/embed/" + id;
    				console.log("DEBUG:", youtubeDomain, id, data.url);
    			}

    			isURLValid(data.url, isValid => {
    				if (isValid) {
		    			requestDomain = new URL(data.url).origin;

	    				getURL(data.url, (data, res) => {
		    				socket.send(JSON.stringify({
		    					type: "html",
		    					url: res ? res.request.uri.href : data.url,
		    					data: data
		    				}));
		    			});
    				} else {
	    				socket.send(JSON.stringify({
	    					type: "status",
	    					url: data.url,
	    					data: "Invalid URL"
	    				}));
    				}
    			});

    			break;
    		}
    		case "translate-request": {
    			translate(data.string, data.fromLang, data.toLang, data => {
    				console.log(data);
    			});
    			break;
    		}
    	}
  	});
});

function isURLValid(url, callback) {
	request({method: 'HEAD', uri: url}, (err, res, body) => {
  		if (!err && res.statusCode == 200) 
   			callback(true);
  		else 
  			callback(false);
	});
}

function getURL(url, callback) {
	console.log(url);
	request.get(url, (err, res, body) => {
		if (err) { return console.log(err); }
	  	callback(body, res);
	});
}

function postURL(url, form, callback) {
	request.post({
		url: url,
		method: "POST",
		followAllRedirects: true,
		jar: true,
		form: form,
	}, (err, res, body) => {
		if (err) { return console.log(err); }
	  	callback(body, res);
  	});
}

function createId(len = 64, chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
	let id = "";
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
}