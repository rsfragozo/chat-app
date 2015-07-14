/************************************************
client-chat.js
Author: Rodrigo Soares Fragozo
************************************************/

$(function(){
  var socket = io.connect();
  var userToPM = undefined;
  var nickname = undefined;

/************************************************
 Socket events
************************************************/
  socket.on('usernames', function(usernames) {
    displayUsers(usernames);
  });

  socket.on('notice', function(notice){
    displayNotice(notice);
  });

  socket.on('message', function(data){
    if (data.to != "everybody" || data.to != undefined) {
      if (nickname == data.to && userToPM != data.from) {
        $('#' + data.from + 'messagebox').append('<b>*</b>');
        return;
      }
    }
    displayMessage(data.message, data.from, data.to)
  });

  socket.on('messages', function(messages){
    for (var key = messages.length-1; key >= 0; key--) {
      displayMessage(messages[key].message, messages[key].from, messages[key].to);
    }
  });

/************************************************
 JQuery scritps
************************************************/

  $('#choose-nickname').submit(function(e){
    e.preventDefault();
    nickname = $('#nickname').val();
    socket.emit('login', { nickname: nickname }, function(err){
      if (err) {
        $('#nick-error').text(err);
        $('#nickname').val('');
      } else {
        $('#nickname-container').hide();
        $('#wrapper').show();
        $("#wrapper").toggleClass("toggled");
      }
    });
  });

  $('#send-message').submit(function(e){
    e.preventDefault();
    var message = $('#new-message').val();
    socket.emit('message', { from: nickname, to: "everybody", message: message } );
    $('#new-message').val('');
  });

  $('#send-pm').submit(function(e){
    e.preventDefault();
    socket.emit('message', { from: nickname, to: userToPM, message: $('#new-pm').val() } );
    $('#new-pm').val('');
  });

/************************************************
 Aditional functions
************************************************/
  function displayUsers(usernames){
    var html = '<li><h4>Hello, ' + nickname + '!</h4><li>';
    for (var i = 0; i < usernames.length; i++) {
      if (usernames[i] != nickname) html += '<li><a href="#" class="user" id="' + usernames[i] + '">' + usernames[i] + '<span id="' + usernames[i] + 'messagebox"></span></a></li>';
    }
    $('#users').html(html);
    $('.user').click(function(e){
      if (!userToPM) $('#pm-col').show();
      userToPM = $(this).attr('id');
      $('#' + userToPM + 'messagebox').empty();
      $('#user-to-pm').html($(this).text());
      $('#private-chat').empty();
      socket.emit('load-old-private-messages', { from: nickname , to: $(this).attr('id') });
    });
  }

  function displayMessage(message, from, to){
    var html = "<p class='message'><strong>" + from + " to " + to + ":</strong> " + message +"</p>";
    if (to == "everybody" || to == undefined) {
      $('#chat').append(html);
    } else {
      $('#private-chat').append(html);
    }
  }

  function displayNotice(notice){
    var html = "<p class='message' style='color: darkgray;'><i><strong>" + notice +"</i></p>";
    $('#chat').append(html);
  }
});
