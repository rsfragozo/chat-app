/************************************************
chat-server.js
Author: Rodrigo Soares Fragozo
************************************************/
var socketio = require('socket.io');
var db = require('./db');
var io;
var users = {}; //Map active users and sockets
var limit = 20; //Number of messages to retrive from history

exports.listen = function(http) {
  io = socketio.listen(http);
  io.sockets.on('connection', function (socket) {
    handleLogins(socket);
    handleMessages(socket);
    handleLoadOldPrivateMessages(socket);
    handleDisconnections(socket);
  });
}

function handleMessages(socket) {
  socket.on('message', function(data){
    db.saveMessage({to: data.to, from: socket.nickname, message: data.message}, function(err){
      if(err) throw err;
      if(data.to == "everybody" || data.to == undefined) {
        io.sockets.emit('message', {to: "everybody", from: socket.nickname, message: data.message});
      } else {
        users[data.to].emit('message', {to: data.to, from: socket.nickname, message: data.message});
        socket.emit('message', {to: data.to, from: socket.nickname, message: data.message});
      }
    });
  });
}

function handleDisconnections(socket) {
  socket.on('disconnect', function () {
    delete users[socket.nickname];
    updateUsersList();
    socket.broadcast.emit('notice', socket.nickname + ' has left the chat.');
  });
}

function handleLogins(socket) {
  socket.on('login', function(data, callback){
    if (data.nickname in users) {
      callback("Oh-oh! This user is already in use.");
      return;
    }
    callback(false);
    socket.nickname = data.nickname;
    users[data.nickname] = socket;
    updateUsersList();
    loadOldMessages(socket, data.nickname);
    socket.broadcast.emit('notice', data.nickname + ' has joined the chat.');
  });
}

function updateUsersList() {
  io.sockets.emit('usernames', Object.keys(users));
}

function loadOldMessages(socket) {
  db.getOldMessages(limit, function(err, messages){
    socket.emit('messages', messages);
  });
}

function handleLoadOldPrivateMessages(socket){
  socket.on('load-old-private-messages', function(data) {
    db.getOldPrivateMessages(data.from, data.to, limit, function(err, messages){
      socket.emit('messages', messages);
    });
  });
}
