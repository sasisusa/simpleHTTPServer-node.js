const http = require('http');
const fs = require('fs');
const path = require('path');


let argv = process.argv.slice(2);
let argAddr = undefined;
let argPort = undefined;
let usedArgCount = 0;
let allArgCount = argv.length;

// Check for help argument -> print help and exit
let bHelp = argv.find((elm) => { 
  return elm === "-h" || elm === "--help"; 
});
if(bHelp){
	console.log("usage: node " + path.basename(process.argv[1]) + " [-h] [--bind ADDRESS] [port]\n");
	console.log("positional arguments:\n  port\t\t\t\tSpecify alternate port [default: 8000]\n");
	console.log("optional arguments:\n  -h, --help\t\t\tshow this help message and exit");
	console.log("  --bind ADDRESS, -b ADDRESS\tSpecify alternate bind addr [default: all interfaces]");
	return;
}


// Check for bind argument
let bBind = argv.find((elm) => { 
  return elm === "-b" || elm === "--bind"; 
});
if(bBind){
	++usedArgCount;
	let indexBind = argv.indexOf(bBind);
	if(indexBind < 0){
		console.log("Error: bind argument.");
		return;
	}
	
	if(require('net').isIP(argv[indexBind+1])){
		++usedArgCount;
		argAddr = argv[indexBind+1];
	}
	else{
		console.log("Error: Invalid IP address.");
		return;
	}

	argv.splice(indexBind, 2);
}


// Check for port argument
let lastArg = argv.slice(-1);
if(!isNaN(parseInt(lastArg))){
	if(isNaN(Number(lastArg))){
		console.log("Error: Invalid argument for port.");
		return;
	}

	let bPort = Number(lastArg)
	if(bPort >= 0 && bPort <= 65535){
		++usedArgCount;
		argPort = bPort;
	}
	else{
		console.log("Error: Invalid port.");
		return;
	}

	argv.splice(argv.length-1, 1);
}


// All argument should processed, if not exit
if(usedArgCount !== allArgCount || argv.length > 0){
	console.log("Error: Invalid argument(s).");
	return;
}


const port = argPort || 8000;
const addr = argAddr || "0.0.0.0"

const server = http.createServer();
server.listen(port, addr);


function HandleRequestGet(req, res)
{
	let dec_requrl = decodeURIComponent(req.url);
	if(req.url.includes('..') || dec_requrl.includes('..')){
		res.writeHead(400, {'Content-Type': 'text/html'});   
		res.write('Error: Bad request.');
		res.end();
		return;
	}

	let loc_requrl = "." + dec_requrl;
	if(fs.existsSync(loc_requrl)){
		if(fs.lstatSync(loc_requrl).isDirectory()){
			retDir = fs.readdirSync(loc_requrl);
			if(Array.isArray(retDir) && retDir.length > 0){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write("<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n");
				res.write("<title>Directory listing for " + loc_requrl.slice(1) + "</title>\n");
				res.write("</head>\n");
				res.write("<body>\n<h1>Directory listing for " + loc_requrl.slice(1) + "</h1>\n<hr>\n<ul>\n");
				retDir.forEach((File, index)=>{
					if(fs.lstatSync(loc_requrl + File).isDirectory()){
						File += "/";
					}
					res.write("<li><a href=\"" + File + "\">" + File + "</a></li>\n");
				});
				res.write("</ul>\n<hr>\n</body>\n</html>");
				res.end();
			}
			else{
				res.writeHead(404, {'Content-Type': 'text/html'});   
				res.write('Error: Reading dir failed.');
				res.end();
			}
		}
		else if(fs.lstatSync(loc_requrl).isFile()){
			fs.readFile(loc_requrl, (err, binaryContent) => {
				if(!err){
					res.writeHead(200, {'Content-Type': 'text/plain'});   
					res.write(binaryContent, "binary");
					res.end();
				}
				else{
					res.writeHead(400, {'Content-Type': 'text/html'});   
					res.write('Error: Read file failed.');
					res.end();
					console.log("Error at readFile: " + err);
				}
			});
		}
		else{
			res.writeHead(404, {'Content-Type': 'text/html'});   
			res.write('Error: Request is neither a file or folder.');
			res.end();
		}
	}
	else{
		res.writeHead(400, {'Content-Type': 'text/html'});   
		res.write('Error: Invalid request.');
		res.end();
	}
}


server.on('request', (req, res) => {
	let retDir = undefined;

	if(req.method === "GET"){
		let t = Date().toString().split(" ");
		let timestamp = t[2]+"/"+t[1]+"/"+t[3]+" "+t[4];
		console.log(req.connection.remoteAddress + " [" + timestamp + "] GET " + req.url);
		HandleRequestGet(req, res);
	}
	else{
		res.writeHead(400, {'Content-Type': 'text/html'});   
		res.write('Error: Invalid request method.');
		res.end();
	}

});

server.on('listening', () => {
  console.log("Serving HTTP on " + addr + " port " + port);
});

server.on('error', (err) => {
  console.log("Error: " + err);
});

server.on('close', () => {
  console.log('Server closed.');
});



