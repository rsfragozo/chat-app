var http = require('http'),
	express = require('express'),
	chatServer = require('./lib/chat-server');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app).listen('80', '0.0.0.0');
chatServer.listen(server);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/views/index.html');
});
