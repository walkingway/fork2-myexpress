var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var crc32 = require('buffer-crc32');
var fs = require("fs");
var path = require('path');
var rparser = require('range-parser');

var proto = {};
proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype

proto.redirect = function(code,path) {
  var body = '';
  if(typeof code == 'string') {
    url = code;
    this.setHeader('Location', url);
    this.statusCode = 302;
    body = '';
  } else {
    this.setHeader('Location', path);
    this.statusCode = code;
    body = '301 - Moved Permanently';
  }
  this.setHeader('Content-Length',body.length);
  this.end(body ? null :body);
};

proto.type = function(ext) {
  // if(this.getHeader('Content-Type')) 
    this.setHeader('Content-Type',mime.lookup(ext));  
}

proto.default_type = function(ext) {
  if(!this.getHeader('Content-Type'))
    this.setHeader('Content-Type',mime.lookup(ext));
}

proto.format = function(dict) {
  var accept = accepts(this.req);
  var array = Object.keys(dict);
  var type = accept.types(array);
  if(type.length) {
    this.type(type);
    dict[type]();
  } else {
    var err = new Error("Not Acceptable");
    err.statusCode = 406;
    throw err;
  }
  
}

proto.fillHead = function(body) {
  var endResult; 
  if(!this.getHeader('Content-Type')) {
    if(Buffer.isBuffer(body)) {
      this.setHeader('Content-Type','application/octet-stream');
      this.setHeader('Content-Length',Buffer.byteLength(body.toString()));
      endResult = body.toString();
    } else if(typeof body == 'string') {
      this.setHeader('Content-Type','text/html');
      this.setHeader("Content-Length",Buffer.byteLength(body));
      endResult = body;
    } else if(typeof body == 'object') {
      this.setHeader('Content-Type','application/json');
      endResult = JSON.stringify(body);
    }    
    return endResult;
  }
}

proto.handleDate = function() {
  if(this.getHeader("Last-Modified")) {
    if(this.getHeader("Last-Modified") && this.getHeader("Last-Modified") <= this.req.headers["if-modified-since"])
      this.statusCode = 304;
    else
      this.statusCode = 200;
  }
}

proto.setETag = function(body){
  if(!this.getHeader('ETag') && body && this.req.method == 'GET') {
    var body = crc32.unsigned(body);
    this.setHeader('ETag','"' + body + '"');
  }
  if(this.req.headers["if-none-match"] == body) this.statusCode = 304;
  this.handleDate();
}

proto.send = function(code,body) {
  if(typeof code == 'number') {
    this.statusCode = code;
    if(body) {
      result = this.fillHead(body);
      this.setETag(body);
      this.end(result);
    } else {
      body = http.STATUS_CODES[code];
      this.setETag(body);
      this.end(body);
    }
  } else {
    body = code;
    body = this.fillHead(body) || body;
    this.setETag(body);
    this.end(body);
  }
}

proto.stream = function(stream) {
  var res = this;
  stream.on("data",function(data) {
    res.end(data);
  });
}

proto.sendfile = function(data,options) {
  var options = options || {};
  var filePath;
  var res = this;
  var req = this.req;
  var range;
  var requestRange = false;
  if(options.hasOwnProperty("root")) {
    filePath = options["root"] + data;
    filePath = path.normalize(filePath);
  } else {
    filePath = data;
  }
  res.setHeader("Accept-Range","bytes");

  fs.stat(filePath,function(err,stats) {
    if(err) {
      if(err.path.indexOf('..') !== -1)
        res.send(403);
      else
        res.send(404);
    } else if(stats.isDirectory()) {
      res.send(403);
    } else {
      res.type(path.extname(filePath));
      res.setHeader('Content-Length',stats.size);
      if(req.headers["range"]) {
        range = rparser(stats.size,req.headers["range"]);
      } else {
        range = -2;
      }
      if(typeof range !== 'number') {
        file = fs.createReadStream(filePath,range[0]);
        requestRange = true;
      } else if(range == -1) {
        res.statusCode = 416;
        res.end();
        // res.send(416);
        return;
      } else if(range == -2) {
        file = fs.createReadStream(filePath);
      }
      if(requestRange) {
        var contentRange = "bytes " + range[0].start + "-" + range[0].end + "/" + stats.size;
        res.setHeader('Content-Range', contentRange);
        res.statusCode = 206;
      }
      res.stream(file);
    }
  });
}

module.exports = proto;