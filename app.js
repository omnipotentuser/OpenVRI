var express = require('express')
    , http = require('http')
    , stylus = require('stylus')
    , nib = require('nib')
    , url = require('url')
    , root = __dirname
    , path = require('path');

var app = express();
var rtcServer = require('./lib/rtc_server');

function compile(str, path) {
    return stylus(str)
	.set('filename', path)
	.set('compress', true)
	.use(nib());
}

app.configure(function(){
    app.set('port', process.env.PORT || 2337);
    app.set('views', __dirname + '/views');
    app.set('assets', __dirname + '/views/assets/');
    app.set('view engine', 'jade');
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(stylus.middleware({src: __dirname + '/public', compile: compile}));
    app.use(express.static(path.join(__dirname, 'public')));

    //app.use(function(req, rest){
//	console.log('%s %s', req.method, req.url);
 //   });
    app.use(function (req, res, next) {
	console.log('%s %s', req.method, req.url);
	req.on('static', function() {
	    var file = url.parse(req.url).pathname;
	    var mode = 'stylesheet';
	    if (file[file.length -1] == '/') {
		file += 'index.html';
		mode = 'reload';
	    }
	    console.log('watching file ' + file);
	    rtcServer.createWatcher(file, mode);
	});
	next();
    });
});

app.configure('production', function(){
    console.log('production mode');
});
app.configure('development', function(){
    console.log('development mode');
    app.use(express.errorHandler());
});

app.get('/', function(req, res) {
    console.log(req.url);
    res.render('index');
});

app.get('/room', function(req, res) {
    console.log(__dirname);
    console.log(req.url);
    res.render('index');
});


app.all('/partial_embed', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.render('embed');
});

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});


rtcServer.listen(server);
