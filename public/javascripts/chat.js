
function logError(error) {
    trace('error: ' + error);
    trace(error.name + ': ' + error.message);
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
	pc = new RTCPeerConnection(ice_config);
	pc.onaddstream = onAddStream;
	pc.onicecandidate = onIceCandidate;
	pc.oniceconnectionstatechange = onIceConnectionStateChange;
	pc.onnegotiationneeded = onNegotiationNeeded;
	pc.onremovestream = onRemoveStream;
	pc.onsignalingstatechange = onSignalingStateChange;
	if(localstream)
	    pc.addStream(localstream);
	else
	    alert('Media device is not detected.');
	trace('OpenRTC::buildClient signaling state: ' + pc.signalingState);
    };

    var onAddStream = function(evt) {
	trace('onAddStream '+evt.stream.id);
	if(orientation == 'two') {
	    trace('Taking up second video display');
	    $('#_openvri_video-src-two').attr('src', window.URL.createObjectURL(evt.stream));
	} else if ( orientation == 'three' ) {
	    trace('Taking up third video display');
	    $('#_openvri_video-src-three').attr('src', window.URL.createObjectURL(evt.stream)).show(1000);
	} else {
	    trace('Room is full');
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
		//trace('ice candidate: ' + evt.candidate);
		socket.emit('candidate', message);
	    }
	};
    };

    var onIceConnectionStateChange = function(){
	trace('onIceConnectionStateChange state: ' + pc.iceConnectionState);
    };

    var onNegotiationNeeded = function(){
	trace('onNegotiationNeeded');
	if(isOffer)
	    pc.createOffer(localDescCreated, logError);
    };

    var onRemoveStream = function(evt){
	trace('onRemoveStream '+evt);
	isVtwo = false;
    };

    var onSignalingStateChange = function(){
	trace('onSignalingStateChange: ' + pc.signalingState);
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
	    trace('setLocalDescription SdpType: ' + message.sdp.type);
	    trace('sdp ' + message.sdp.sdp);
	    socket.emit('sdp', message)
	}, logError);
    }

    this.peerCreateOffer = function () {
	pc.createOffer(localDescCreated, logError); 
    };

    // Not in use. Prefer to use onnegotiationneeded event.
    //function peerCreateAnswer(p) {
    //	pc.createAnswer(localDescCreated, logError); 
    //};

    this.addIceCandidate = function (p_candidate) {
	if(pc){
	    trace('Create new Ice Candidate for peer');
	    pc.addIceCandidate(new RTCIceCandidate(p_candidate));
	} else {
	    trace('No peer candidate instance');
	};
    };

    this.setRemoteDescription = function (p_remote_sdp) {
	pc.setRemoteDescription(new RTCSessionDescription(p_remote_sdp), function () {
	    if(pc.remoteDescription.type == 'offer') {
		trace('createAnswer to remote sdp offer');
		pc.createAnswer(localDescCreated, logError);
	    }
	}, logError);
    };
};

(function() {

    var joinRoom = function (p_socket, p_room) {
	if(p_room !== null || p_room !== undefined || p_room !== '') {
	    trace('joining ' + p_room);
	    p_socket.emit('join', {room:p_room} );
	}
    };

    this.startMedia = function(p_localvideo, p_socket, p_room){
	getUserMedia(
	    {
		video : true,
		audio : true
	    },

	    function(p_stream){
		this.localstream = p_stream;
		p_localvideo.show();
		p_localvideo.attr('src', window.URL.createObjectURL(this.localstream));
		p_localvideo.onloadedmetadata = function(e){
		    trace('onloadedmetadata: ' + e);
		};
		joinRoom(p_socket, p_room);
	    },
	    logError
	);
    };

    this.stopMedia = function(p_socket){
	if(this.localstream){
	    trace('stopping local media stream');
	    this.localstream.stop();
	    p_socket.emit('exit');
	}
    }

    this.sendMsg = function(p_socket, p_code, p_roomName) {
	trace('sending ' + p_code);
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

    this.localstream;
})();
