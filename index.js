var http = require('http');

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

  myexpress.use = function(fun) {
    
    this.stack.push(fun);
  }

  myexpress.handle = function(req,res,out) {

    var index = 0;
    var stack = this.stack;

    if(stack.length == 0) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end("404 - Not Found");
      return;
    }

    function next(error) {
      var f = stack[index++];

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
        } else if(arity == 3) {
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