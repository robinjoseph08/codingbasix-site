/***************************************/
/***             REQUIRE             ***/
/***************************************/

var express = require('express')
	, engine = require('ejs-locals')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , mongo = require('mongojs')
  , packer = require('node.packer')
  , spawn = require('child_process').spawn;

/***************************************/
/***            CONFIGURE            ***/
/***************************************/

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);
});

packer({
  log: true,
  minify: true,
  input: [
    __dirname + '/stylesheets/style.css',
    __dirname + '/stylesheets/index.css',
    __dirname + '/stylesheets/header.css',
  ],
  output: __dirname + '/stylesheets/style.min.css',
  callback: function ( err, code ){
    err && console.log( err );
  }
});

packer({
  log: true,
  minify: true,
  input: [
    __dirname + '/scripts/jquery-1.10.2.min.js',
  ],
  output: __dirname + '/scripts/scripts.min.css',
  callback: function ( err, code ){
    err && console.log( err );
  }
});

app.configure(function(){
	// ejs
  app.set('view engine', 'ejs');
	// ejs-locals for templating
	app.engine('ejs', engine);
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.session({secret: process.env.SESSION_KEY || 'SECRETKEY'}));
});

// set the port
var port = process.env.PORT || 3000;

// configure the database URL
var databaseUrl = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'robins-node-blog';

// establish the mongo tables
var collections = ['tutorial_categories'];
// connect to the mongo DB
var db = mongo.connect(databaseUrl, collections);

/***************************************/
/***              ROUTE              ***/
/***************************************/

app.get('/', function (req, res) {
	console.log('GET /');
	// db.posts.save({
	// 	title: "This is the second title",
	// 	body: "This is the second body.",
	// 	created_at: new Date().getTime(),
	// 	liked: 0
	// }, function(err, saved) {
	//   if(err || !saved)
	//   	console.log("Post not saved");
	//   else
	//   	console.log("Post saved");
	//   	console.log(saved);
	// });
  res.render('index', {});
});

app.get('/admin', function (req, res) {
	console.log('GET /admin');
  res.render('admin_login', {
  });
});

app.get('/style.min.css', function (req, res) {
  console.log('GET /style.min.css');
  res.sendfile(__dirname + '/stylesheets/style.min.css');
});

app.get('/scripts.min.css', function (req, res) {
  console.log('GET /scripts.min.css');
  res.sendfile(__dirname + '/scripts/scripts.min.css');
});

app.get('/amble-regular-webfont.eot', function (req, res) {
  console.log('GET /amble-regular-webfont.eot');
  res.sendfile(__dirname + '/fonts/amble-regular-webfont.eot');
});

app.get('/amble-regular-webfont.woff', function (req, res) {
  console.log('GET /amble-regular-webfont.woff');
  res.sendfile(__dirname + '/fonts/amble-regular-webfont.woff');
});

app.get('/amble-regular-webfont.ttf', function (req, res) {
  console.log('GET /amble-regular-webfont.ttf');
  res.sendfile(__dirname + '/fonts/amble-regular-webfont.ttf');
});

app.get('/amble-regular-webfont.svg', function (req, res) {
  console.log('GET /amble-regular-webfont.svg');
  res.sendfile(__dirname + '/fonts/amble-regular-webfont.svg');
});

/***************************************/
/***              LISTEN             ***/
/***************************************/

server.listen(port, function() {
	console.log('Listening on port ' + port);
});

/***************************************/
/***            SOCKET.IO            ***/
/***************************************/

io.sockets.on('connection', function(socket) {
  socket.on('enter', function(data) {
    var cmd = spawn(data.cmd,data.args);
    cmd.stdout.on('data', function (data) {
      socket.emit('term_res', {res: '' + data}); // add the '' + to convert to string
    });
  });
});