var http = require('http');
var mime = require('mime');
var accepts = require('accepts');

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
  var type = typeof body;

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

proto.send = function(code,body){

  if(typeof code == 'number'){
    this.statusCode = code;
    if(body){
      result = this.fillHead(body);
      this.end(result);
    } else {
      body = http.STATUS_CODES[code];
      this.end(body);
    }
  } else {
    body = code;
    body = this.fillHead(body) || body;
    this.end(body);
  }
}

module.exports = proto;