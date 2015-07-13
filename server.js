var http = require('http'),
	express = require('express'),
	chatServer = require('./lib/chat-server');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app).listen('3000', '127.0.0.1');
chatServer.listen(server);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/views/index.html');
});
