
var _openvri_localstream;

function logError(error) {
    console.log('error: ' + error);
    console.log(error.name + ': ' + error.message);
}

function Peer(p_socket, p_id, p_roomName, p_orientation) {
    var pc,
	isOffer,
	socket = p_socket,
	peerid = p_id,
	roomName = p_roomName,
	orientation = p_orientation, // two, three
	ice_config = {iceServers:[]},
	credentials = [
	    {

		url:"stun:stun.counterpath.net"
	    },
	    /*
	    {
		url:'stun:stun3.1.google.com:19301'
	    },
	    {
	        url:'stun:stun.softjoys.com'
	    },
	    {
		url:'stun:stun01.sipphone.com'
	    }
	    */
	    {   
		url:"stun:numb.viagenie.ca", 
		username:"nick@openvri.com", 
		credential:"numb01"
	    }, 
	    {
		url:"turn:numb.viagenie.ca", 
		username:"nick@openvri.com", 
		credential:"numb01"
	    }
	];

    this.getid = function () {
	return (peerid);
    };

    this.hasPC = function () {
	return (pc) ? true : false ;
    }

    this.getOrientation = function () {
	if(orientation)
	    return orientation;
    }

    this.buildClient = function(p_offer){
	isOffer = p_offer;
	for(var i = 0; i<credentials.length; i++){
	    var iceServer = {};
	    iceServer = createIceServer(credentials[i].url,
			credentials[i].username,
			credentials[i].credential);	
	    ice_config.iceServers.push(iceServer);
	}
	pc = new RTCPeerConnection(ice_config, {'optional': [{'DtlsSrtpKeyAgreement': 'true'}]});
	pc.onaddstream = onAddStream;
	pc.onicecandidate = onIceCandidate;
	pc.oniceconnectionstatechange = onIceConnectionStateChange;
	pc.onnegotiationneeded = onNegotiationNeeded;
	pc.onremovestream = onRemoveStream;
	pc.onsignalingstatechange = onSignalingStateChange;
	console.log('readyState: ' + pc.readyState);
	console.log('signalingState: ' + pc.signalingState);
	if(_openvri_localstream)
	    pc.addStream(_openvri_localstream);
	else
	    alert('Media device is not detected.');
	console.log('post addStream readyState: ' + pc.readyState);
	console.log('post addStream signalingState: ' + pc.signalingState);
    };

    var onAddStream = function(evt) {
	console.log('onAddStream '+evt.stream.id);
	if(orientation == 'two') {
	    console.log('Taking up second video display');
	    jQuery('#_openvri_video-src-two').attr('src', window.URL.createObjectURL(evt.stream));
	} else if ( orientation == 'three' ) {
	    console.log('Taking up third video display');
	    jQuery('#_openvri_video-src-three').attr('src', window.URL.createObjectURL(evt.stream)).show(1000);
	} else {
	    console.log('Room is full');
	};
    };

    var onIceCandidate = function(evt){
	if(evt.candidate){
	    candidate = evt.candidate;
	    var message = {
		room: roomName,
		candidate:evt.candidate,
		to_id: peerid
	    };
	    if(socket){
		//console.log('ice candidate: ' + evt.candidate);
		socket.emit('candidate', message);
	    }
	};
    };

    var onIceConnectionStateChange = function(){
	console.log('onIceConnectionStateChange state: ' + pc.iceConnectionState);
    };

    var onNegotiationNeeded = function(){
	console.log('onNegotiationNeeded');
	//if(isOffer)
	 //   pc.createOffer(localDescCreated, logError);
    };

    var onRemoveStream = function(evt){
	console.log('onRemoveStream '+evt);
	isVtwo = false;
    };

    var onSignalingStateChange = function(){
	console.log('onSignalingStateChange: ' + pc.signalingState);
    };

    var localDescCreated = function(desc){
	if(pc.signalingState == 'closed')
	    return;
	pc.setLocalDescription(desc, function() {
	    var message = {
		room: roomName,
		sdp: pc.localDescription,
		to_id: peerid
	    };
	    console.log('setLocalDescription SdpType: ' + message.sdp.type);
	    console.log('sdp ' + message.sdp.sdp);
	    socket.emit('sdp', message)
	}, logError);
    }

    this.peerCreateOffer = function () {
	pc.createOffer(localDescCreated, logError); 
    };

    // Not in use.
    //function peerCreateAnswer(p) {
    //	pc.createAnswer(localDescCreated, logError); 
    //};

    this.addIceCandidate = function (p_candidate) {
	if(pc){
	    console.log('Create new Ice Candidate for peer');
	    pc.addIceCandidate(new RTCIceCandidate(p_candidate));
	} else {
	    console.log('No peer candidate instance');
	};
    };

    this.setRemoteDescription = function (p_remote_sdp) {
//	var wait = function () {
//	    if( pc.signalingState === undefined ){
//		console.log('setRemoteDescription signalingState undefined');
//		setTimeout( wait, 10 );
//	    } else {
		console.log('setRemoteDescription signalingState ' + pc.signalingState);
		pc.setRemoteDescription(new RTCSessionDescription(p_remote_sdp), function () {
		    if(pc.remoteDescription.type == 'offer') {
			console.log('createAnswer to remote sdp offer');
			pc.createAnswer(localDescCreated, logError);
		    }
		}, logError);
//	    };
//	};

//	wait();
    };
};

(function() {

    var joinRoom = function (p_socket, p_room) {
	if(p_room !== null || p_room !== undefined || p_room !== '') {
	    console.log('joining ' + p_room);
	    p_socket.emit('join', {room:p_room} );
	}
    };

    this.startMedia = function(p_localvideo, p_socket, p_room){
	if(typeof getUserMedia == 'undefined') {
	    console.log('getUserMedia undefined, trying again.');
	    setTimeout( this.startMedia(p_localvideo, p_socket, p_room), 10 )
	} else {
	    console.log('calling getUserMedia');
	    getUserMedia(
		{
		    video : true,
		    audio : true
		},

		function(p_stream){
		    _openvri_localstream = p_stream;
		    p_localvideo.show();
		    p_localvideo.attr('src', window.URL.createObjectURL(_openvri_localstream));
		    p_localvideo.onloadedmetadata = function(e){
			console.log('onloadedmetadata: ' + e);
		    };
		    joinRoom(p_socket, p_room);
		},
		logError
	    );
	}	    
    }

    this.stopMedia = function(p_socket){
	if(_openvri_localstream){
	    console.log('stopping local media stream');
	    _openvri_localstream.stop();
	    p_socket.emit('exit');
	}
    }

    this.sendMsg = function(p_socket, p_code, p_roomName) {
	console.log('sending ' + p_code);
	if(p_roomName == null || p_roomName === ''){
	    alert('Please join a room first before sending a message!');
	    return;
	}

	var message = {
	    room: p_roomName,
	    code: p_code
	};
	p_socket.emit('code', message);
    }


})();
