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
  , spawn = require('child_process').spawn
  , fork = require('child_process').fork;

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
    __dirname + '/stylesheets/tutorials.css',
    __dirname + '/stylesheets/font-awesome.min.css',
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

  // db.posts.save({
  //  title: "This is the second title",
  //  body: "This is the second body.",
  //  created_at: new Date().getTime(),
  //  liked: 0
  // }, function(err, saved) {
  //   if(err || !saved)
  //    console.log("Post not saved");
  //   else
  //    console.log("Post saved");
  //    console.log(saved);
  // });

app.get('/', function (req, res) {
  console.log('GET /');
  res.render('index', {});
});

app.get('/tutorials', function (req, res) {
  console.log('GET /tutorials');
  res.render('tutorials/index', {});
});

app.get('/tutorials/:category', function (req, res) {
  console.log('GET /tutorials/' + req.params['category']);
  res.render('tutorials/' + req.params['category'] + '/index', {});
});

app.get('/tutorials/:category/:id', function (req, res) {
  console.log('GET /tutorials/' + req.params['category'] + '/' + req.params['id']);
  res.render('tutorials/' + req.params['category'] + '/' + req.params['id'], {});
});

app.get('/blog', function (req, res) {
  console.log('GET /tutorials');
  res.render('blog', {});
});

app.get('/about', function (req, res) {
  console.log('GET /about');
  res.render('about', {});
});

app.post('/requests', function (req, res) {
  console.log('POST /requests');
  console.log(req.body.data);
  res.json(200, { data: 'got em'});
});

// Compiled Assets
app.get('/style.min.css', function (req, res) {
  console.log('GET /style.min.css');
  res.sendfile(__dirname + '/stylesheets/style.min.css');
});

app.get('/scripts.min.css', function (req, res) {
  console.log('GET /scripts.min.css');
  res.sendfile(__dirname + '/scripts/scripts.min.css');
});

// Amble Font
app.get('/amble-regular-webfont.(eot|woff|ttf|svg)', function (req, res) {
  console.log('GET /amble-regular-webfont.' + req.params[0]);
  res.sendfile(__dirname + '/fonts/amble-regular-webfont.' + req.params[0]);
});

// Source Code Pro Font
app.get('/sourcecodepro-regular-webfont.(eot|woff|ttf|svg)', function (req, res) {
  console.log('GET /sourcecodepro-regular-webfont.' + req.params[0]);
  res.sendfile(__dirname + '/fonts/sourcecodepro-regular-webfont.' + req.params[0]);
});

// Font Awesome
app.get('/fontawesome-webfont.(eot|woff|ttf|svg)', function (req, res) {
  console.log('GET /fontawesome-webfont.' + req.params[0]);
  res.sendfile(__dirname + '/fonts/fontawesome-webfont.' + req.params[0]);
});

// Catch All For 404
app.get('(*)', function (req, res) {
  console.log('GET ' + req.params[0]);
  console.log('404');
  res.render('404', {});
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
  var bashjs = fork(__dirname + '/bash.js');
  socket.emit('home', {res: process.env['HOME']});
  bashjs.on('message',function(m) {
    if(m.stdout) {
      socket.emit('term_res', {res: m.stdout});
    }
    if(m.cwd) {
      socket.emit('dir', {res: m.cwd});
    }
    if(m.tab) {
      socket.emit('tab', {res: m.tab});
    }
  });
  // enetered command
  socket.on('enter', function(data) {
    var _cmd = data.cmd.replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
    // console.log(_cmd);
    // if(new RegExp('(^ *| *\| *| *&& *| *; *)su( |$)|(^ *| *\| *| *&& *| *; *(then)* *)sudo( |$|;|&&)','g').test(_cmd)) {
    //   bash.stdin.write('echo \'~~~ No root for you! ~~~\'\n');
    // } else if(new RegExp('(^ *| *\| *| *&& *| *; *)rm( |$)|(^ *| *\| *| *&& *| *; *(then)* *)srm( |$|;|&&)','g').test(_cmd)) {
    //   bash.stdin.write('echo \'~~~ You probably shouldn\'\'t be deleting things you don\'\'t know about... ~~~\'\n');
    // } else {
    //   bash.stdin.write(_cmd + '\n');
    // }
    // if(new RegExp('(^ *| *\| *| *&& *| *; *(then)* *)cd *[^|]*$|^ *$|>','g').test(_cmd)) {
    //   state = 1;
    //   bash.stdin.write('pwd\n');
    // }
    var cmd_array = _cmd.split(' ');
    while(cmd_array.length > 1 && cmd_array[cmd_array.length-2][cmd_array[cmd_array.length-2].length-1] == '\\') {
      cmd_array[cmd_array.length-1] = cmd_array[cmd_array.length-2] + ' ' + cmd_array[cmd_array.length-1]
      cmd_array.splice(cmd_array.length-2,1);
    }
    bashjs.send({ cmd: cmd_array[0], cmd_array: cmd_array.slice(1,cmd_array.length) });
  });
  // tab completion
  socket.on('tab', function(data) {
    var _cmd = data.cmd.replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
    var cur = '', cmd;
    var cmd_array = _cmd.split(' ');
    while(cmd_array.length > 1 && cmd_array[cmd_array.length-2][cmd_array[cmd_array.length-2].length-1] == '\\') {
      cmd_array[cmd_array.length-1] = cmd_array[cmd_array.length-2] + ' ' + cmd_array[cmd_array.length-1];
      cmd_array.splice(cmd_array.length-2,1);
    }
    var cmd_array2 = cmd_array[cmd_array.length-1].split('/');
    cmd = cmd_array2[cmd_array2.length-1];
    for(var i = 0; i < cmd_array2.length-1; i++) {
      cur += cmd_array2[i] + '/';
    }
    bashjs.send({ tab: true, cmd: cmd, cur: cur });
  });

  socket.on('disconnect', function () {
    console.log('socket disconnected');
    bashjs.disconnect();
  });
});