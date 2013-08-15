$(function() {
    var peers = [],
	roomName,
	pageCounter = 1,
	socket = io.connect(), 
	localId;

    var shiftKeyCode = {'192':'126', '49':'33', '50':'64', '51':'35', '52':'36', '53':'37', '54':'94', '55':'38', '56':'42', '57':'40', '48':'41', '189':'95', '187':'43', '219':'123', '221':'125', '220':'124', '186':'58', '222':'34', '188':'60', '190':'62', '191':'63'};
    var specialCharCode = {'8':'8', '13':'13', '32':'32', '186':'58', '187':'61', '188':'44', '189':'45', '190':'46', '191':'47', '192':'96', '219':'91', '220':'92', '221':'93', '222':'39'};

    this.logError = function(error) {
	trace('error: ' + error);
	trace(error.name + ': ' + error.message);
    }

    function handleJoinRoom(socket) {
	socket.on('id', function(message){
	    localId = message.yourId;
	    trace('localId: ' + localId);
	});
    };

    function handleCreatePeers(socket, p_roomName) {
	socket.on('createPeers', function(message){
	    trace('createPeers');
	    var users = message.users;
	    for(var i = 0; i < message.len; i++){
		var pid = users.shift();
		trace('creating new peer ' + pid);
		var orient = createDisplay();
		if(orient !== undefined){
		    var peer = new Peer(socket, pid, p_roomName, orient);
		    $('#video-src-one').attr('animation-name', 'slideout');
		    $('#message-src-one').attr('animation-name', 'slideout');
		}
		peers.push(peer);
	    }
	});
    }

    function handleCreateOffer(socket, p_roomName) {
	socket.on('createOffer', function(message){
	    trace('createOffer for remote peer: ' + message.id);
	    var orient = createDisplay();
	    if(orient !== undefined){
		var peer = new Peer(socket, message.id, p_roomName, orient);
		$('#video-src-one').attr('animation-name', 'slideout');
		$('#message-src-one').attr('animation-name', 'slideout');
	    }
	    peer.buildClient(true);
	    peers.push(peer);
	});
    }

    function handleIceCandidate(socket) {
	socket.on('candidate', function(message) {
	    for(var i = 0; i < peers.length; i++){
		if(peers[i].getid() == message.from_id) {
		    if(!peers[i].hasPC()){
			trace('ICE Candidate received: PC not ready. Building.');
			peers[i].buildClient(false);
		    };
		    trace('Remote ICE candidate ' + message.candidate.candidate);
		    peers[i].addIceCandidate(message.candidate);
		};
	    };
	});
    }

    function handleSetRemoteDescription(socket) {
	socket.on('sdp', function (message) {
	    trace('sdp offer received');
	    for(var i = 0; i < peers.length; i++) {
		if(peers[i].getid() == message.from_id){
		    if(!peers[i].hasPC()){
			trace('SDP received: PC not ready. Building.');
			peers[i].buildClient(false);
		    };
		    peers[i].setRemoteDescription(message.sdp);
		}
	    };
	});
    }

    function handleClientDisconnected(socket) {
	socket.on('exit', function (message) {
	    trace('handleClientDisconnected');
	    for(var i = 0; i < peers.length; i++) {
		if(peers[i].getid() == message.from_id){
		    if(peers[i].hasPC()){
			var orient = peers[i].getOrientation();
			if( orient == 'two' ) {
			    $('#video-src-two').remove();
			    $('#message-src-two').remove();
			} else if (orient == 'three') {
			    $('#video-src-three').remove();
			    $('#message-src-three').remove();
			}
			$('#video-src-one').attr('animation-name', 'slidein');
			$('#message-src-one').attr('animation-name', 'slidein');
			peers.splice(i, 1);
			return;
		    };
		}
	    };
	});
    }

    function handleErrorCode(socket) {
	socket.on('error', function(message) {
	    switch (message.error) {
		case 'room full': 
		    alert('Room is full');
		    break;
		case 'room empty':
		    alert('Room is empty');
		    break;
		default:
		    trace('Error of some sort');
		    break;
	    }
	});
    }

    function createDisplay() {
	var orientation = undefined;
	trace('begin creating display');
	if( $('#video-src-two').length  == 0){
	    $('#video-body').append("<video id='video-src-two' class='video-box'  autoplay='autoplay' controls='controls'>");
	    $('#message-body').append("<textarea id='message-src-two' class='messages' disabled='disabled'>");
	    orientation = 'two';
	} else if( $('#video-src-three').length == 0 ) {
	    $('#video-body').append("<video id='video-src-three' class='video-box'  autoplay='autoplay' controls='controls'>");
	    $('#message-body').append("<textarea id='message-src-three' class='messages' disabled='disabled'>");
	    orientation = 'three';
	} else {
	    trace('Somebody is trying to join');
	}
	trace('orientation ' + orientation);
	return orientation;
    }

    function handleReceiveCode(socket) {
	socket.on('code', function(message) {
	    var code = String.fromCharCode(message.code);
	    for(var i = 0; i < peers.length; i++) {
		trace(peers[i].getid() + ' == ' + message.from_id);
		if(peers[i].getid() == message.from_id){
		    if(!peers[i].hasPC()){
			trace('Message received: PC not ready.');
			return;
		    } else {
			if( peers[i].getOrientation() ){
			    var orient = peers[i].getOrientation();
			    if(orient == 'two'){
				if(message.code == '8')
				    $('#message-src-two').val( $('#message-src-two').val().slice(0,-1) );
				else
				    $('#message-src-two').val($('#message-src-two').val() + code);
			    } else {
				if(message.code == '8')
				    $('#message-src-three').val( $('#message-src-three').val().slice(0,-1) );
				else
				    $('#message-src-three').val($('#message-src-three').val() + code);
			    }
			}
		    };
		    return;
		}
	    };
	});
    }

    function setupRTC(p_socket, p_roomName) {

	handleJoinRoom(socket);
	handleCreatePeers(socket, p_roomName);
	handleCreateOffer(socket, p_roomName);
	handleIceCandidate(socket);
	handleSetRemoteDescription(socket);
	handleReceiveCode(socket);
	handleClientDisconnected(socket);
	handleErrorCode(socket);

	// get the media running then join a session
	startMedia($('#video-src-one'), p_socket, p_roomName);
    }

    $(document).ready(function() {

	roomName = window.location.hash.substring(1);
	trace('roomName: ' + roomName);
	if(roomName != ''){
	    $('#dialog').dialog('open');
	};
    });

    $('#dialog').dialog({
	autoOpen: false,
	width: 1510,
	height: 860,
	show:{
	    effect: "clip",
	    duration:500
	},
	hide:{
	    effect:'clip',
	    duration:500
	},
	open: function (event, ui) { 
	    setupRTC(socket, roomName);
	},
	close: function (event, ui) {
	   document.location.href='/'; 
	}
    });

    $('#createBtn').click(function () {
	console.log('createBtn clicked');
	roomName = generateID();
	pageCounter++;
	window.history.pushState(pageCounter, 'VRI Lite', 'room#' + roomName);
	$('#dialog').dialog('open');
    });

    $('#hangupBtn').click(function () {
	trace('hangupBtn clicked');
	stopMedia(socket);
	$("#dialog").dialog('close');
    });

    $('#inviteBtn').click(function() {
	trace('inviteBtn clicked');
	alertify.alert('Share this URL: \n' + document.URL + "\n\n");
    });

    $('#message-src-one').on('keydown', function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	console.log(e.type, e.which, e.keyCode);

	if( code == '37' || code == '38' || code == '39' || code == '40' ){
	    e.preventDefault();
	    return;
	}

	if( code  != 16 ) {// ignore shift
	    if( code >= 65 && code <= 90 ) {
		if(!e.shiftKey){
		    code = code + 32;
		}
		sendMsg(socket, code, roomName);
	    } else if(e.shiftKey && (shiftKeyCode[code] !== undefined) ){
		code = shiftKeyCode[code];
		sendMsg(socket, code, roomName);
	    } else if(specialCharCode[code] !== undefined){
		code = specialCharCode[code];
		sendMsg(socket, code, roomName);
	    } else if ( code >= 48 && code <= 57 ) {
		sendMsg(socket, code, roomName);
	    } else {
		trace('code not accepted');
		return;
	    };

	}

    })

    // kudos to webrtc.io and dennis
    function S4 () {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    function generateID () {
	return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
    };
});
