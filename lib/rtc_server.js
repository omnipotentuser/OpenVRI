var socketio = require('socket.io');
var io;
var currentRoom = {};
var watchers = {};

// array of rooms with array of users and their info
var rooms = []; // [ { roomname: name, [ { userid: id, icecandidate: RTCIceCandidate, sdp: RTCSessionDescription } ], ... } ]

exports.listen = function(server){
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket){
	console.log('socket connected with id: ' + socket.id);
	//handleGetId(socket);
	handleJoinRoom(socket);
	handleClientExit(socket);
	handleMessageBroadcasting(socket);
	handleIceCandidate(socket);
	handleSetRemoteDescription(socket);
	handleClientDisconnect(socket);
    });

}

exports.createWatcher = function(p_file, p_event) {
    var absolute = path.join(__dirname, file);
    if(watchers[absolute]) {
	return;
    }

    fs.watchFile(absolute, function(curr, prev) {
	if(curr.mtime !== prev.mtime) {
	    io.sockets.emit(p_event, p_file);
	}
    });

    watchers[absolute] = true;
}

function joinRoom(socket, room){
    socket.join(room);
    currentRoom[socket.id] = room;
    var usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1 && usersInRoom.length < 4){
	console.log('number of users: ' + usersInRoom.length);
	console.log('id ' + socket.id + ' joining');
	var peers = [],
	    peerlen = 0;
	for(var i = 0; i<usersInRoom.length; i++){
	    if( usersInRoom[i].id != socket.id ) {
		peers.push(usersInRoom[i].id);
		peerlen++;
	    };
	};
	socket.broadcast.to(room).emit('createOffer', {id:socket.id});
	socket.emit('createPeers', {len:peerlen, users:peers});
    } else if ( usersInRoom.length > 3 ){
	console.log('Error: Room is full');
	socket.emit('error', {error:'room full'});
    } else if (usersInRoom.length < 1 ){
	console.log('Error: Nobody is in the room');
	socket.emit('error', {error:'room empty'});
    }
}

function handleJoinRoom(socket){
    socket.on('join', function (message) {
	if(currentRoom[socket.id])
	    socket.leave(currentRoom[socket.id]);
	console.log('joining ' + message.room);
	socket.emit('id', {yourId:socket.id});
	joinRoom(socket, message.room);
    });
}

function handleMessageBroadcasting(socket){
    socket.on('code', function (message) {
	//console.log("Node received message " + message.code);
	message.from_id = socket.id;
	socket.broadcast.to(message.room).emit('code', message);
    });
}

function handleIceCandidate(socket){
    socket.on('candidate', function(message){
	//console.log('Node received candidate '+message.candidate.candidate);
	//console.log('candidate received: ' + message.room);
	message.from_id = socket.id;
	io.sockets.socket(message.to_id).emit('candidate', message);
   });
};

function handleSetRemoteDescription(socket) {
    socket.on('sdp', function(message){
	message.from_id = socket.id;
	io.sockets.socket(message.to_id).emit('sdp', message);
    });
};

function handleClientDisconnect(socket) {
    socket.on('disconnect', function() {
	console.log('Client disconnected from ' + currentRoom[socket.id]);
	var message = {from_id: socket.id, room: currentRoom[socket.id]};
	socket.broadcast.to(message.room).emit('exit', message);
	socket.leave(currentRoom[socket.id]);
	if(currentRoom[socket.id])
	    delete currentRoom[socket.id];
    });
};

function handleClientExit(socket) {
    socket.on('exit', function () {
	console.log('Client exiting from room ' + currentRoom[socket.id]);
	socket.broadcast.to(currentRoom[socket.id]).emit('exit', {from_id: socket.id});
	socket.leave(currentRoom[socket.id]);
	if(currentRoom[socket.id])
	    delete currentRoom[socket.id];
    });
};
