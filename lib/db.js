var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/chat', function(err){
	if(err) {
		console.log(err);
	} else {
		console.log('Connected to mongodb!');
	}
});

var chatSchema = mongoose.Schema({
	to: String, 
	from: String,
    msg: String,
	created: { type: Date, default: Date.now }
});

var Chat = mongoose.model('Message', chatSchema);

exports.getOldMsgs = function(limit, cb){
	var query = Chat.find({ to: "everybody"});
	query.sort('-created').limit(limit).exec(function(err, docs){
		cb(err, docs);
	});
}

exports.getOldPrivateMsgs = function(from, to, limit, cb){
	var query = Chat.find({ $and : [
                              { $or : [ { from : from }, { from : to } ] },
                              { $or : [ { to : from }, { to : to } ] }
                            ]
                          });
	query.sort('-created').limit(limit).exec(function(err, docs){
		cb(err, docs);
	});
}

exports.saveMsg = function(data, cb){
	var newMsg = new Chat({to: data.to, from: data.from, msg: data.msg});
	newMsg.save(function(err){
		cb(err);
	});
};