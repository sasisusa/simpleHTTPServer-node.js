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
					let ext = extTypes[path.extname(loc_requrl).substring(1)];
					if(ext){
						res.writeHead(200, {'Content-Type': ext});
					}
					else{
						res.writeHead(200, {'Content-Type': 'text/plain'}); 
					}

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
  console.log(err);
});

server.on('close', () => {
  console.log('Server closed.');
});









// Object found on https://gist.github.com/rrobe53/976610
const extTypes = { 
		"3gp"   : "video/3gpp"
		, "a"     : "application/octet-stream"
		, "ai"    : "application/postscript"
		, "aif"   : "audio/x-aiff"
		, "aiff"  : "audio/x-aiff"
		, "asc"   : "application/pgp-signature"
		, "asf"   : "video/x-ms-asf"
		, "asm"   : "text/x-asm"
		, "asx"   : "video/x-ms-asf"
		, "atom"  : "application/atom+xml"
		, "au"    : "audio/basic"
		, "avi"   : "video/x-msvideo"
		, "bat"   : "application/x-msdownload"
		, "bin"   : "application/octet-stream"
		, "bmp"   : "image/bmp"
		, "bz2"   : "application/x-bzip2"
		, "c"     : "text/x-c"
		, "cab"   : "application/vnd.ms-cab-compressed"
		, "cc"    : "text/x-c"
		, "chm"   : "application/vnd.ms-htmlhelp"
		, "class"   : "application/octet-stream"
		, "com"   : "application/x-msdownload"
		, "conf"  : "text/plain"
		, "cpp"   : "text/x-c"
		, "crt"   : "application/x-x509-ca-cert"
		, "css"   : "text/css"
		, "csv"   : "text/csv"
		, "cxx"   : "text/x-c"
		, "deb"   : "application/x-debian-package"
		, "der"   : "application/x-x509-ca-cert"
		, "diff"  : "text/x-diff"
		, "djv"   : "image/vnd.djvu"
		, "djvu"  : "image/vnd.djvu"
		, "dll"   : "application/x-msdownload"
		, "dmg"   : "application/octet-stream"
		, "doc"   : "application/msword"
		, "dot"   : "application/msword"
		, "dtd"   : "application/xml-dtd"
		, "dvi"   : "application/x-dvi"
		, "ear"   : "application/java-archive"
		, "eml"   : "message/rfc822"
		, "eps"   : "application/postscript"
		, "exe"   : "application/x-msdownload"
		, "f"     : "text/x-fortran"
		, "f77"   : "text/x-fortran"
		, "f90"   : "text/x-fortran"
		, "flv"   : "video/x-flv"
		, "for"   : "text/x-fortran"
		, "gem"   : "application/octet-stream"
		, "gemspec" : "text/x-script.ruby"
		, "gif"   : "image/gif"
		, "gz"    : "application/x-gzip"
		, "h"     : "text/x-c"
		, "hh"    : "text/x-c"
		, "htm"   : "text/html"
		, "html"  : "text/html"
		, "ico"   : "image/vnd.microsoft.icon"
		, "ics"   : "text/calendar"
		, "ifb"   : "text/calendar"
		, "iso"   : "application/octet-stream"
		, "jar"   : "application/java-archive"
		, "java"  : "text/x-java-source"
		, "jnlp"  : "application/x-java-jnlp-file"
		, "jpeg"  : "image/jpeg"
		, "jpg"   : "image/jpeg"
		, "js"    : "application/javascript"
		, "json"  : "application/json"
		, "log"   : "text/plain"
		, "m3u"   : "audio/x-mpegurl"
		, "m4v"   : "video/mp4"
		, "man"   : "text/troff"
		, "mathml"  : "application/mathml+xml"
		, "mbox"  : "application/mbox"
		, "mdoc"  : "text/troff"
		, "me"    : "text/troff"
		, "mid"   : "audio/midi"
		, "midi"  : "audio/midi"
		, "mime"  : "message/rfc822"
		, "mml"   : "application/mathml+xml"
		, "mng"   : "video/x-mng"
		, "mov"   : "video/quicktime"
		, "mp3"   : "audio/mpeg"
		, "mp4"   : "video/mp4"
		, "mp4v"  : "video/mp4"
		, "mpeg"  : "video/mpeg"
		, "mpg"   : "video/mpeg"
		, "ms"    : "text/troff"
		, "msi"   : "application/x-msdownload"
		, "odp"   : "application/vnd.oasis.opendocument.presentation"
		, "ods"   : "application/vnd.oasis.opendocument.spreadsheet"
		, "odt"   : "application/vnd.oasis.opendocument.text"
		, "ogg"   : "application/ogg"
		, "p"     : "text/x-pascal"
		, "pas"   : "text/x-pascal"
		, "pbm"   : "image/x-portable-bitmap"
		, "pdf"   : "application/pdf"
		, "pem"   : "application/x-x509-ca-cert"
		, "pgm"   : "image/x-portable-graymap"
		, "pgp"   : "application/pgp-encrypted"
		, "pkg"   : "application/octet-stream"
		, "pl"    : "text/x-script.perl"
		, "pm"    : "text/x-script.perl-module"
		, "png"   : "image/png"
		, "pnm"   : "image/x-portable-anymap"
		, "ppm"   : "image/x-portable-pixmap"
		, "pps"   : "application/vnd.ms-powerpoint"
		, "ppt"   : "application/vnd.ms-powerpoint"
		, "ps"    : "application/postscript"
		, "psd"   : "image/vnd.adobe.photoshop"
		, "py"    : "text/x-script.python"
		, "qt"    : "video/quicktime"
		, "ra"    : "audio/x-pn-realaudio"
		, "rake"  : "text/x-script.ruby"
		, "ram"   : "audio/x-pn-realaudio"
		, "rar"   : "application/x-rar-compressed"
		, "rb"    : "text/x-script.ruby"
		, "rdf"   : "application/rdf+xml"
		, "roff"  : "text/troff"
		, "rpm"   : "application/x-redhat-package-manager"
		, "rss"   : "application/rss+xml"
		, "rtf"   : "application/rtf"
		, "ru"    : "text/x-script.ruby"
		, "s"     : "text/x-asm"
		, "sgm"   : "text/sgml"
		, "sgml"  : "text/sgml"
		, "sh"    : "application/x-sh"
		, "sig"   : "application/pgp-signature"
		, "snd"   : "audio/basic"
		, "so"    : "application/octet-stream"
		, "svg"   : "image/svg+xml"
		, "svgz"  : "image/svg+xml"
		, "swf"   : "application/x-shockwave-flash"
		, "t"     : "text/troff"
		, "tar"   : "application/x-tar"
		, "tbz"   : "application/x-bzip-compressed-tar"
		, "tcl"   : "application/x-tcl"
		, "tex"   : "application/x-tex"
		, "texi"  : "application/x-texinfo"
		, "texinfo" : "application/x-texinfo"
		, "text"  : "text/plain"
		, "tif"   : "image/tiff"
		, "tiff"  : "image/tiff"
		, "torrent" : "application/x-bittorrent"
		, "tr"    : "text/troff"
		, "txt"   : "text/plain"
		, "vcf"   : "text/x-vcard"
		, "vcs"   : "text/x-vcalendar"
		, "vrml"  : "model/vrml"
		, "war"   : "application/java-archive"
		, "wav"   : "audio/x-wav"
		, "wma"   : "audio/x-ms-wma"
		, "wmv"   : "video/x-ms-wmv"
		, "wmx"   : "video/x-ms-wmx"
		, "wrl"   : "model/vrml"
		, "wsdl"  : "application/wsdl+xml"
		, "xbm"   : "image/x-xbitmap"
		, "xhtml"   : "application/xhtml+xml"
		, "xls"   : "application/vnd.ms-excel"
		, "xml"   : "application/xml"
		, "xpm"   : "image/x-xpixmap"
		, "xsl"   : "application/xml"
		, "xslt"  : "application/xslt+xml"
		, "yaml"  : "text/yaml"
		, "yml"   : "text/yaml"
		, "zip"   : "application/zip"
	}
