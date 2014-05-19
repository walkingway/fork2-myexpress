var http = require('http');
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
module.exports = proto;