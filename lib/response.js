var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var crc32 = require('buffer-crc32');

var proto = {};
proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype

proto.redirect = function(code,path){
  var body = '';
  if(typeof code == 'string'){
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

proto.type = function(ext){
  this.setHeader('Content-Type',mime.lookup(ext));  
}

proto.default_type = function(ext){
  if(!this.getHeader('Content-Type'))
  this.setHeader('Content-Type',mime.lookup(ext));
}

proto.format = function(dict){
  var accept = accepts(this.req);
  var array = Object.keys(dict);
  var type = accept.types(array);
  if(type.length){
    this.type(type);
    dict[type]();
  } else {
    var err = new Error("Not Acceptable");
    err.statusCode = 406;
    throw err;
  }
  
}

proto.fillHead = function(body){
  var endResult; 
  if(!this.getHeader('Content-Type')){
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

proto.handleDate = function(){
  if(this.getHeader("Last-Modified")){
    if(this.getHeader("Last-Modified") && this.getHeader("Last-Modified") <= this.req.headers["if-modified-since"])
      this.statusCode = 304;
    else
      this.statusCode = 200;
  }
}

proto.setETag = function(body){
  if(!this.getHeader('ETag') && body && this.req.method == 'GET'){
    var body = crc32.unsigned(body);
    this.setHeader('ETag','"' + body + '"');
  }
  if(this.req.headers["if-none-match"] == body) 
    this.statusCode = 304;
  else
    this.statusCode = 200;
  this.handleDate();
}

proto.send = function(code,body){
  if(typeof code == 'number'){
    this.statusCode = code;
    if(body){
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

module.exports = proto;