var http = require('http');
var Layer = require('./lib/layer.js');
var makeRoute = require('./lib/route.js');
var methods = require('methods').concat("all");
var request = require('./lib/request');
var response = require('./lib/response');

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

  myexpress.use = function(path,fun,option) {
    if(typeof path == 'function'){
      var transTofun = path;
      var layer = new Layer('/',transTofun,option);
    } else if (typeof fun.handle === "function") {
        var subLayer = fun.stack[0];
        var subFun = subLayer.handle;
        var subPath = subLayer.layerPath;
        var combinePath = trialingSlash(path) + subPath;
        var layer = new Layer(combinePath,subFun,option);
        layer.outPath = subPath;
    } else {
      var layer = new Layer(path,fun,option);
    }
    this.stack.push(layer);
    // this.stack.push(layer.handle);
  }

  // myexpress.get = function(path,handle) {
  //   var fun = makeRoute("GET",handle);
  //   var layer = new Layer(path,fun,true);
  //   this.stack.push(layer);
  // }

  myexpress.handle = function(req,res,out) {

    myexpress.monkey_patch(req,res);
    var index = 0;
    var stack = this.stack;
    req.app = myexpress;
    var isSub;
    function next(error,isSub) {
      if(isSub) req.app = myexpress;
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
          if(layer.outPath) req.url = layer.outPath;
        }
      }

      if(!f) {
        // if(out) return out(error);
        if(out){
          isSub = true; 
          return out(error,isSub);
        }
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

  // methods.forEach(function(method){
  //   myexpress[method] = function(path, handler){
  //     var fun = makeRoute(method.toLocaleUpperCase(), handler);
  //     var layer = new Layer(path, fun, true);
  //     this.stack.push(layer);
  //   }
  // });

  myexpress.route = function(path){
    var route = makeRoute();
    myexpress.use(path,route,true);
    return route;
  };

  methods.forEach(function(method){
    myexpress[method] = function(path,handler){
      myexpress.route(path)[method](handler);
      return this;
    }
  });

  myexpress.monkey_patch = function(req,res){
    req.__proto__ = request
    res.__proto__ = response;
    req.res = res;
    res.req = req;
    // req.app = myexpress;
  }

  return myexpress;
}

