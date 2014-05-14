var http = require('http');
var Layer = require('./lib/layer.js');

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

  myexpress.use = function(route,fun) {
    if(typeof route == 'function'){
      var transTofun = route;
      var layer = new Layer('/',transTofun);
    } else {
      var layer = new Layer(route,fun);
    }
    this.stack.push(layer);
    // this.stack.push(layer.handle);
  }

  myexpress.handle = function(req,res,out) {

    var index = 0;
    var stack = this.stack;
    // if(stack.length == 0) {
    //   res.statusCode = 404;
    //   res.setHeader('Content-Type', 'text/html');
    //   res.end("404 - Not Found");
    //   return;
    // }

    function next(error) {

      var layer = stack[index++];
      var i = 0;
      var f;
      if (layer){
        while(!layer.match(req.url)){
          layer = stack[i++];
        }
        var params = layer.match(req.url).params;
        req.params = params;
        f = layer.handle;
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

  return myexpress;
}

