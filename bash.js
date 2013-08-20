var spawn = require('child_process').spawn;

process.on('message', function(m) {
  console.log('CHILD got message:', m);
  if(m.tab) {
  	var ls = spawn('ls', (m.cur != '' ? [m.cur] : [])),
    	egrep = spawn('egrep', ['^' + m.cmd]);

    ls.stdout.on('data', function (data) {
		  egrep.stdin.write(data);
		});

		ls.stderr.on('data', function (data) {
		  console.log('ls stderr: ' + data);
		});

		ls.on('close', function (code) {
		  if(code !== 0) {
		    console.log('ps process exited with code ' + code);
		  }
		  egrep.stdin.end();
		});

		egrep.stdout.on('data', function (data) {
		  console.log('' + data);
			process.send({ tab: '' + data });
		});

		egrep.stderr.on('data', function (data) {
		  console.log('egrep stderr: ' + data);
		});

		egrep.on('close', function (code) {
		  if (code !== 0) {
		    console.log('grep process exited with code ' + code);
		  }
		});
  } else {
	  var cmd = spawn(m.cmd, m.cmd_array);
	  if(m.cmd == 'cd') {
			process.chdir(m.cmd_array[0]);
	  }
	  cmd.on('error',function(err) {
	  	console.log('the cmd errored');
	  	console.log(err);
	  });
	  cmd.stderr.on('data', function(data) {
	  	console.log('' + data);
	  });
	  cmd.stdout.on('data', function(data) {
	  	console.log('' + data);
			process.send({ stdout: '' + data });
	  });
	  cmd.on('close',function() {
	  	console.log('the cmd closed');
			process.send({ cwd: process.cwd() });
	  });
	}
});

process.chdir(process.env['HOME']);