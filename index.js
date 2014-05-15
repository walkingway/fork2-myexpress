var http = require('http');
var Layer = require('./lib/layer.js');
var makeRoute = require('./lib/route.js');
var methods = require('methods');

module.exports = function() {

  var myexpress  = function(req,res,next) {
    // response.statusCode = 404;
    // response.end();
    myexpress.handle(req,res,next);
  }

  myexpress.listen = function(port,done) {

    var server = http.createServer(myexpress);

    server.listen(port,done);

    return server;
  }

  myexpress.stack = [];

  function trialingSlash(str){
    if(str.substr(str.length-1, 1) == "/")
    str = str.substr(0,str.length-1);
    return str;
  }

  myexpress.use = function(route,fun) {
    if(typeof route == 'function'){
      var transTofun = route;
      var layer = new Layer('/',transTofun);
    } else if (typeof fun.handle === "function") {
        var subLayer = fun.stack[0];
        var subFun = subLayer.handle;
        var subRoute = subLayer.layerPath;
        var combineRoute = trialingSlash(route) + subRoute;
        var layer = new Layer(combineRoute,subFun);
        layer.outRoute = subRoute;
    } else {
      var layer = new Layer(route,fun);
    }
    this.stack.push(layer);
    // this.stack.push(layer.handle);
  }

  myexpress.get = function(path,handle) {
    var fun = makeRoute("GET",handle);
    var layer = new Layer(path,fun,true);
    this.stack.push(layer);
  }

  myexpress.handle = function(req,res,out) {

    var index = 0;
    var stack = this.stack;

    function next(error) {

      var layer = stack[index++];
      var i = index;
      var f;
      if (layer){
        while(!layer.match(req.url) && i<stack.length){
          layer = stack[i++];
        }
        if(layer.match(req.url)){
          var params = layer.match(req.url).params;
          req.params = params;
          f = layer.handle;
          if(layer.outRoute) req.url = layer.outRoute;
        }
      }

      if(!f) {
        if(out) return out(error);
        if(error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          res.end("500 - Internal Error");
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          res.end("404 - Not Found");
        }
        return;
      }

      try {
        var arity = f.length;
        if(error) {
          if(arity == 4) {
            f(error,req,res,next);
          } else {
            next(error);
          }
        } else if(arity < 4) {

            f(req,res,next);
        } else {
          //arity == 4 && `next` is called without an error
          next();
        }
        
      } catch(e) {
        next(e);
      }

    }
    
    next();
  }

  methods.forEach(function(method){
    myexpress[method] = function(path, handler){
      var fun = makeRoute(method.toLocaleUpperCase(), handler);
      var layer = new Layer(path, fun, true);
      this.stack.push(layer);
    }
  });

  return myexpress;
}

