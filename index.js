var http = require('http');

module.exports = function(){

  var myexpress  = function(req,res,next){
    // response.statusCode = 404;
    // response.end();
    myexpress.handle(req,res,next);
  }

  myexpress.listen = function(port,done){

    var server = http.createServer(myexpress);

    server.listen(port, function(){
      done();
    });

    return server;
  }

  myexpress.stack = [];

  myexpress.use = function(fun){
    
    this.stack.push(fun);
  }

  myexpress.handle = function(req,res,out){

    var index = 0;
    var stack = this.stack;

    if(stack.length == 0){
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end("404 - Not Found");
      return;
    }

    function next(error){
      var f = stack[index++];

      if(!f){
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end("404 - Not Found");
        return;
      }

      f(req,res,next);
    }
    
    next();
  }

  return myexpress;
}


