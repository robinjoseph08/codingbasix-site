var express = require('express')
	, engine = require('ejs-locals')
  , app = express()
  , mongo = require('mongojs');
  // , io = require('socket.io').listen(server);

// io.configure(function () {
//   io.set("transports", ["xhr-polling"]);
//   io.set("polling duration", 10);
// });

app.configure(function(){
	// use ejs-locals for all ejs templates:
	app.engine('ejs', engine);
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

var port = process.env.PORT || 3000;

var databaseUrl = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'robins-node-blog';

var collections = ['posts'];
var db = mongo.connect(databaseUrl, collections);

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
  res.sendfile(__dirname + '/index.html');
});

app.get('/blog', function (req, res) {
	console.log('GET /blog');

  res.render('blog', {
  	title: 'Robin Joseph\'s Blog',
  	post: db.posts.find()
  });
});

app.get('/style.css', function (req, res) {
	console.log('GET /style.css');
  res.sendfile(__dirname + '/style.css');
});

app.listen(port, function() {
	console.log('Listening on port ' + port);
});

// app.get('/jquery.js', function (req, res) {
//   res.sendfile(__dirname + '/jquery.min.js');
// });