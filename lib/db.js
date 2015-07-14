/************************************************
db.js
Author: Rodrigo Soares Fragozo
************************************************/
var mongoose = require('mongoose');

var mongodb_url = 'mongodb://rsfadm:RSFADM@ds043942.mongolab.com:43942/chat-rsf';
//var mongodb_url = 'mongodb://localhost/chat-rsf';

mongoose.connect(mongodb_url, function(err){
	if(err) {
		console.log(err);
	} else {
		console.log('Connected to mongodb!');
	}
});

var chatSchema = mongoose.Schema({
	to: String, 
	from: String,
    message: String,
	created: { type: Date, default: Date.now }
});

var Chat = mongoose.model('Message', chatSchema);

exports.getOldMessages = function(limit, cb){
	var query = Chat.find({ to: "everybody"});
	query.sort('-created').limit(limit).exec(function(err, docs){
		cb(err, docs);
	});
}

exports.getOldPrivateMessages = function(from, to, limit, cb){
	var query = Chat.find({ $and : [
                              { $or : [ { from : from }, { from : to } ] },
                              { $or : [ { to : from }, { to : to } ] }
                            ]
                          });
	query.sort('-created').limit(limit).exec(function(err, docs){
		cb(err, docs);
	});
}

exports.saveMessage = function(data, cb){
	var newMessage = new Chat({to: data.to, from: data.from, message: data.message});
	newMessage.save(function(err){
		cb(err);
	});
};
