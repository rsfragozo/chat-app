$(function(){
	var socket = io.connect();
	// id of user that is being private messaged
	var userToPM = undefined;
    var myNick = undefined;

	$('#choose-nickname').submit(function(e){
		e.preventDefault();
		var nick = $('#nickname').val();
		socket.emit('choose-nickname', nick, function(err){
			if (err) {
				$('#nick-error').text(err);
				$('#nickname').val('');
			} else {
				$('#nickname-container').hide();
				$('#wrapper').show();
				$("#wrapper").toggleClass("toggled");
        myNick = nick;
			}
		});
	});

	socket.on('names', function(users) {
		displayUsers(users);
	});

	socket.on('new-user', function(user) {
		displayUsers([user]);
	});

	function displayUsers(users){
		var html = '', html_collapsed = '';
		for (var i = 0; i < users.length; i++) {
      if (users[i].nick != myNick)
				html += '<li><a href="#" class="user" id="user' + users[i].id + '">' + users[i].nick + '<span id="user' + users[i].id + 'msgbox"></span></a></li>';
				html_collapsed += '<li><a href="#" class="user" id="user' + users[i].id + '-collapsed">' + users[i].nick + '<span id="user' + users[i].id + 'msgbox"></span></a></li>';
			}
			$('#users').append(html);
	    $('#users-collapsed').append(html_collapsed);
			$('.user').click(function(e){
    	if (!userToPM) {
            $('#pm-col').show();
    	}
    	userToPM = $(this).attr('id').substring(4);
			$('#user' + userToPM + 'msgbox').empty();
    	$('#user-to-pm').html($(this).text());
      $('#private-chat').empty();
      socket.emit('load-old-private-messages', { from: myNick , to: $(this).text() });
    });
	}

	socket.on('user-disconnect', function(id){
		console.log(id);
		$('#user'+id).remove();
	});

    $('#send-message').submit(function(e){
        e.preventDefault();
        var msg = $('#new-message').val();
        socket.emit('message', msg);
        $('#new-message').val('');
    });

    socket.on('message', function(data){
    	displayMsg(data.msg, data.from, data.to)
    });

    socket.on('load-old-messages', function(docs){
    	for (var i = docs.length-1; i >= 0; i--) {
    		displayMsg(docs[i].msg, docs[i].from, docs[i].to);
    	}
    });

    function displayMsg(msg, from, to){
    	var html = "<span class='msg'><strong>" + from + " to " + to + ":</strong> " + msg +"</span>";
        if (to == "everybody") {
          $('#chat').append(html);
        } else {
          $('#private-chat').append(html);
        }
    }

    $('#send-pm').submit(function(e){
    	e.preventDefault();
    	socket.emit('private-message', {msg: $('#new-pm').val(), userToPM: userToPM});
    	$('#new-pm').val('');
    });

    socket.on('private-message', function(data){
			if (myNick == data.from || userToPM == data.id) {
				displayMsg(data.msg, data.from, data.to);
			} else {
				$('#user' + data.id + 'msgbox').append('<b>*</b>');
			}
    });

});
