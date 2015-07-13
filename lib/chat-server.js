var socketio = require('socket.io');
var db = require('./db');
var io;
// maps socket.id to user's nickname
var nicknames = {};
// list of socket ids
var clients = [];
var namesUsed = [];

exports.listen = function(server){
  io = socketio.listen(server);
  io.sockets.on('connection', function(socket){
    initializeConnection(socket);
    handleChoosingNickname(socket)
    handleDisconnection(socket);
    handleLoadOldPrivateMessages(socket);
    handlePublicMessage(socket);
    handlePrivateMessage(socket);
  });
}

function initializeConnection(socket){
  loadActiveUsers(socket);
  loadOldPublicMessages(socket);
}

function loadActiveUsers(socket){
  var activeNames = [];
  var usersInRoom = io.of("/").connected;
  for (var index in usersInRoom){
    var userSocketId = usersInRoom[index].id;
    if (userSocketId !== socket.id && nicknames[userSocketId]){
      var name = nicknames[userSocketId];
      activeNames.push({id: namesUsed.indexOf(name), nick: name});
    }
  }
  console.debug(activeNames);
  socket.emit('names', activeNames);
}

function loadOldPublicMessages(socket){
  db.getOldMsgs(5, function(err, docs){
    socket.emit('load-old-messages', docs);
  });
}

function handleLoadOldPrivateMessages(socket){
  socket.on('load-old-private-messages', function(data) {
    db.getOldPrivateMsgs(data.from, data.to, 5, function(err, docs){
      console.debug("load-old-private-messages");
      console.debug(docs);
      socket.emit('load-old-messages', docs);
    });
  });
}

function handleChoosingNickname(socket){
  socket.on('choose-nickname', function(nick, cb) {
    if (namesUsed.indexOf(nick) !== -1) {
      cb('Oh-oh! This nickname is already in use!');
      return;
    }
    var ind = namesUsed.push(nick) - 1;
    clients[ind] = socket;
    nicknames[socket.id] = nick;
    cb(null);
    io.sockets.emit('new-user', {id: ind, nick: nick});
  });
}

function handlePublicMessage(socket){
  socket.on('message', function(msg){
    var from = nicknames[socket.id];
    db.saveMsg({from: from, to: "everybody", msg: msg}, function(err){
      if(err) throw err;
      io.sockets.emit('message', {from: from, to: "everybody", msg: msg});
      console.debug("Message from "+ from +" to everybody: "+ msg);
    });
  });
}

function handlePrivateMessage(socket){
  socket.on('private-message', function(data){
    var from = nicknames[socket.id];
    var to = nicknames[clients[data.userToPM].id];
    db.saveMsg({to: to, from: from, msg: data.msg}, function(err){
      if(err) throw err;
      clients[data.userToPM].emit('private-message', {id: namesUsed.indexOf(nicknames[socket.id]), to: to, from: from, msg: data.msg});
      socket.emit('private-message', {id: namesUsed.indexOf(nicknames[socket.id]), to: to, from: from, msg: data.msg});
      console.debug("Message from "+ from +" to "+ to +": "+ data.msg);
    });

  });
}

function handleDisconnection(socket){
  socket.on('disconnect', function(){
    var ind = namesUsed.indexOf(nicknames[socket.id]);
    delete namesUsed[ind];
    delete clients[ind];
    delete nicknames[socket.id];
    io.sockets.emit('user-disconnect', ind);
  });
}
