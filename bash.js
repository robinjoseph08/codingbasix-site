var spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	fs = require('fs'),
	cmd_stack = [];

process.on('message', function(m) {
  console.log('CHILD got message:', m);
  if(m.tab) { // tab completion
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
  } else if(m.ctrl_d) { // ^D
  	if(cmd_stack.length > 0) {
  		cmd_stack[cmd_stack.length-1].stdin.end();
  	}
  } else if(m.ctrl_c) { // ^C
  	if(cmd_stack.length > 0) {
  		cmd_stack[cmd_stack.length-1].kill('SIGINT');
  	}
  } else if(m.stdin) { // funnel input to stdin of last cmd
		if(cmd_stack.length > 0) {
			cmd_stack[cmd_stack.length-1].stdin.write(m.str);
		}
  } else { // new cmd
  	var cd_index = (m.cmd == 'cd' ? [0] : []);
		var cmd = m.cmd + ' ';
		for(var i = 0; i < m.cmd_array.length; i++) {
			cmd += m.cmd_array[i] + ' ';
			if(m.cmd_array[i] == 'cd') {
				cd_index.push(i + 1);
			}
		}
		cmd_stack.push(exec(cmd, function(err,stdout,stderr) {
			if(stdout) {
		  	console.log('' + stdout);
				process.send({ stdout: '' + stdout });
			}
			if(stderr) {
		  	console.log('' + stderr);
				process.send({ stdout: '' + stderr });
			}
			if(err) {
		  	console.log('the cmd errored');
		  	console.log(err);
			}
	  	console.log('this cmd has closed');
	  	cmd_stack.splice(cmd_stack.indexOf(this),1);
	  	console.log(cmd_stack.length);
			process.send({ cwd: process.cwd() });
		}));
	  console.log(cmd_stack.length);
	  if(cd_index.length > 0) {
			for(var i = 0; i < cd_index.length; i++) {
				try {
					process.chdir((m.cmd_array[cd_index[i]] ? m.cmd_array[cd_index[i]] : process.env['HOME']));
				} catch(err) {
					// process.send({ stdout: '' + err });
				}
			}
	  }
	}
});

process.chdir(process.env['HOME']);