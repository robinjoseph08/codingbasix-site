/***************************************/
/***             REQUIRE             ***/
/***************************************/

var express = require('express')
	, engine = require('ejs-locals')
  , app = express()
  , mongo = require('mongojs')
  , packer = require('node.packer');

/***************************************/
/***            CONFIGURE            ***/
/***************************************/

packer({
  log: true,
  minify: true,
  input: [
    __dirname + '/stylesheets/index.css',
    __dirname + '/stylesheets/header.css',
  ],
  output: __dirname + '/stylesheets/style.min.css',
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
var collections = ['posts'];
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
  res.render('index', {
  	post: db.posts.find()
  });
  res.sendfile(__dirname + '/index.html');
});

app.get('/blog', function (req, res) {
	console.log('GET /blog');
  res.render('blog', {
  	post: db.posts.find()
  });
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

/***************************************/
/***              LISTEN             ***/
/***************************************/

app.listen(port, function() {
	console.log('Listening on port ' + port);
});