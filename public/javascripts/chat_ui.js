
var SOCK_ADDR = '' ; // your socket.io address goes here

jQuery(function() {
    var peers = [],
	roomName,
	socket = io.connect(SOCK_ADDR),
	pageCounter = 1,
	localId;

    var shiftKeyCode = {'192':'126', '49':'33', '50':'64', '51':'35', '52':'36', '53':'37', '54':'94', '55':'38', '56':'42', '57':'40', '48':'41', '189':'95', '187':'43', '219':'123', '221':'125', '220':'124', '186':'58', '222':'34', '188':'60', '190':'62', '191':'63'};
    var specialCharCode = {'8':'8', '13':'13', '32':'32', '186':'58', '187':'61', '188':'44', '189':'45', '190':'46', '191':'47', '192':'96', '219':'91', '220':'92', '221':'93', '222':'39'};

    var logError = function(error) {
	console.log(error.name + ': ' + error.message);
    }

    function handleJoinRoom(socket) {
	socket.on('id', function(message){
	    localId = message.yourId;
	    console.log('localId: ' + localId);
	});
    };

    function handleCreatePeers(socket, p_roomName) {
	socket.on('createPeers', function(message){
	    console.log('createPeers');
	    var users = message.users;
	    if(users.length > 0)
		asyncCreatePeers(users, p_roomName);
	});
    }

    function asyncCreatePeers(p_users, p_roomName) {
	    var pid = p_users.shift();
	    console.log('creating new peer ' + pid);
	    jQuery('#_openvri_video-src-one').animate({ marginLeft: '-=243px'}, 200);
	    jQuery('#_openvri_message-src-one').animate({ marginLeft: '-=243px'}, 200);
	    
	    var orient = createDisplay();
	    var peer = new Peer(socket, pid, p_roomName, orient);
	    peers.push(peer);
	    if(p_users.length > 0)
		asyncCreatePeers( p_users, p_roomName );
    }

    function handleCreateOffer(socket, p_roomName) {
	socket.on('createOffer', function(message){
	    console.log('createOffer for remote peer: ' + message.id);
	    jQuery('#_openvri_video-src-one').animate({ marginLeft: '-=243px'}, 200 );
	    jQuery('#_openvri_message-src-one').animate({ marginLeft: '-=243px'}, 200, function() {
		var orient = createDisplay();
		var peer = new Peer(socket, message.id, p_roomName, orient);
		peer.buildClient(true);
		peers.push(peer);
		peer.peerCreateOffer();
	    });
	});
    }

    function handleIceCandidate(socket) {
	socket.on('candidate', function(message) {
	    for(var i = 0; i < peers.length; i++){
		if(peers[i].getid() == message.from_id) {
		    if(!peers[i].hasPC()){
			console.log('ICE Candidate received: PC not ready. Building.');
			peers[i].buildClient(false);
		    };
		    console.log('Remote ICE candidate ' + message.candidate.candidate);
		    peers[i].addIceCandidate(message.candidate);
		};
	    };
	});
    }

    function handleSetRemoteDescription(socket) {
	socket.on('sdp', function (message) {
	    console.log('sdp offer received');
	    for(var i = 0; i < peers.length; i++) {
		if(peers[i].getid() == message.from_id){
		    if(!peers[i].hasPC()){
			console.log('SDP received: PC not ready. Building.');
			peers[i].buildClient(false);
		    };
		    peers[i].setRemoteDescription(message.sdp);
		}
	    };
	});
    }

    function handleClientDisconnected(socket) {
	socket.on('exit', function (message) {
	    console.log('handleClientDisconnected');
	    for(var i = 0; i < peers.length; i++) {
		if(peers[i].getid() == message.from_id){
		    if(peers[i].hasPC()){
			var orient = peers[i].getOrientation();
			if( orient == 'two' ) {
			    jQuery('#_openvri_video-src-two').remove();
			    jQuery('#_openvri_message-src-two').remove();
			} else if (orient == 'three') {
			    jQuery('#_openvri_video-src-three').remove();
			    jQuery('#_openvri_message-src-three').remove();
			}
			jQuery('#_openvri_video-src-one').animate({ marginLeft: '+=243px'}, 200);
			jQuery('#_openvri_message-src-one').animate({ marginLeft: '+=243px'}, 200);
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
		    console.log('Error of some sort');
		    break;
	    }
	});
    }

    function createDisplay() {
	var orientation;
	console.log('begin creating display');
	if( jQuery('#_openvri_video-src-two').length  == 0){
	    jQuery('#_openvri_video-body').append("<video id='_openvri_video-src-two' class='_openvri_video-box'  autoplay='autoplay' controls='controls'>");
	    jQuery('#_openvri_message-body').append("<textarea id='_openvri_message-src-two' class='_openvri_messages' disabled='disabled'>");
	    orientation = 'two';
	} else if( jQuery('#_openvri_video-src-three').length == 0 ) {
	    jQuery('#_openvri_video-body').append("<video id='_openvri_video-src-three' class='_openvri_video-box'  autoplay='autoplay' controls='controls'>");
	    jQuery('#_openvri_message-body').append("<textarea id='_openvri_message-src-three' class='_openvri_messages' disabled='disabled'>");
	    orientation = 'three';
	} else {
	    console.log('Somebody is trying to join');
	}
	console.log('orientation ' + orientation);
	return orientation;
    }

    function handleReceiveCode(socket) {
	socket.on('code', function(message) {
	    var code = String.fromCharCode(message.code);
	    for(var i = 0; i < peers.length; i++) {
		console.log(peers[i].getid() + ' == ' + message.from_id);
		if(peers[i].getid() == message.from_id){
		    if(!peers[i].hasPC()){
			console.log('Message received: PC not ready.');
			return;
		    } else {
			if( peers[i].getOrientation() ){
			    var orient = peers[i].getOrientation();
			    if(orient == 'two'){
				if(message.code == '8')
				    jQuery('#_openvri_message-src-two').val( jQuery('#_openvri_message-src-two').val().slice(0,-1) );
				else
				    jQuery('#_openvri_message-src-two').val(jQuery('#_openvri_message-src-two').val() + code);
			    } else {
				if(message.code == '8')
				    jQuery('#_openvri_message-src-three').val( jQuery('#_openvri_message-src-three').val().slice(0,-1) );
				else
				    jQuery('#_openvri_message-src-three').val(jQuery('#_openvri_message-src-three').val() + code);
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
	doMedia(p_socket, p_roomName);
    }

    function doMedia(p_socket, p_roomName) {
	setTimeout( function() {
	    
	    if( typeof startMedia == 'undefined' ) {
		doMedia(p_socket, p_roomName);
	    } else {
		startMedia(jQuery('#_openvri_video-src-one'), p_socket, p_roomName);
	    }

	}, 10 );
    }
    
    function createFirstDisplay() {
	if( jQuery('#_openvri_video-src-one').length  == 0 ) {
	    jQuery('#_openvri_video-body').append("<video id='_openvri_video-src-one' class='_openvri_video-box'  autoplay='autoplay' controls='controls'>");
	    jQuery('#_openvri_dialog').dialog('open');
	}
    }

    jQuery(document).ready(function() {

	var hashurl = window.location.hash;
	var hashpos = hashurl.lastIndexOf('#');
	if(hashpos != -1){
	    hashurl = hashurl.substring(hashpos + 1);
	}
	if(hashpos == -1) {
	    roomName = '';
	} else if ( hashurl.length == 36 ){
	    roomName = hashurl;
	} else {
	   roomName = '';
	   logError({name: 'token', message: 'requirements not met to create a room'}); 
	}

	if(roomName != ''){
	    createFirstDisplay();
	};
	//jQuery('#_openvri_inviteURL').hide();
    });

    jQuery('#_openvri_dialog').dialog({
	autoOpen: false,
	width: 1485,
	height: 768,
	modal: true,
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
	    //pageCounter++;
	    //window.history.pushState(pageCounter, 'VRI Lite', '/');
	}
    });

    jQuery('#_openvri_createBtn').click(function () {
	console.log('createBtn clicked');
	roomName = generateID();
	pageCounter++;
	window.history.pushState(pageCounter, 'VRI Lite', '#' + roomName);
	createFirstDisplay();
	//jQuery('#_openvri_dialog').dialog('open');
    });

    jQuery('#_openvri_hangupBtn').click(function () {
	console.log('hangupBtn clicked');
	/*
	for(var i = peers.length - 1; i >= 0; i--) {
	    if(peers[i].hasPC()){
		var orient = peers[i].getOrientation();
		if( orient == 'two' ) {
		    jQuery('#_openvri_video-src-two').remove();
		    jQuery('#_openvri_message-src-two').remove();
		} else if (orient == 'three') {
		    jQuery('#_openvri_video-src-three').remove();
		    jQuery('#_openvri_message-src-three').remove();
		}
		jQuery('#_openvri_video-src-one').attr('animation-name', 'slidein');
		jQuery('#_openvri_message-src-one').attr('animation-name', 'slidein');
		peers.splice(i, 1);
	    };
	};
	*/
	stopMedia(socket);
	if(jQuery('#_openvri_inviteDialog').is(':visible'))
	    jQuery('#_openvri_inviteDialog').hide(500);
	jQuery("#_openvri_dialog").dialog('close');
	jQuery('#_openvri_video-src-one').remove();
    });

    jQuery('#_openvri_inviteBtn').click(function() {
	console.log('inviteBtn clicked');
	document.getElementById('_openvri_urlAddr').innerHTML = getURL();
	jQuery('#_openvri_inviteDialog').toggle(1000);
    });

    jQuery('#_openvri_closeInviteBtn').click( function() {
	if(jQuery('#_openvri_inviteDialog').is(':visible'))
	    jQuery('#_openvri_inviteDialog').toggle(500);
    });

    // Not yet implemented
    jQuery('#_openvri_clipboardBtn').click( function() {
	jQuery('#_openvri_urlAddr').select();
	//var r = document.body.createTextRange();
	//var copiedText = document.getElementById('_openvri_urlAddr');
	//r.findText(copiedText.textContent);
	window.clipboardData.setData('Text', jQuery('#_openvri_urlAddr').text());
	alert(window.clipboardData.getData('Text'));
    });

    jQuery('#_openvri_message-src-one').on('keydown', function(e) {
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
		console.log('keycode not accepted');
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
    }

    function getURL () {
	var pathArray = window.location.href.split('/');
	var protocol = pathArray[0];
	var host = pathArray[2];
	var url = protocol + '//' + host;
	for(var i = 3; i < pathArray.length; i++){
	    url += '/' + pathArray[i];
	}
	return url;
    }
});
