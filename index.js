var http = require('http');

module.exports = function(){
  var myexpress  = function(request, response){
    response.statusCode = 404;
    response.end();
  }

  myexpress.listen = function(port,done){
    var server = http.createServer(myexpress);
    server.listen(port, function(){
      done();
    });
    return server;
  }
  return myexpress;
}
