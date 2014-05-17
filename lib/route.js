// module.exports = function(verb,handler){
//   return function(req,res,next){
//     if(req.method == verb) {
//       handler(req,res,next);
//     } else {
//       res.statusCode = 404;
//       res.end("404 Not Found");
//     }
//   }
// }
var methods = require('methods');

module.exports = function(){
  var route = function(req,res,next){
    route.handler(req,res,next);
  }

  route.stack = [];

  route.use = function(verb,handler){
    
    if (verb == "all"){
      methods.forEach(function(method){
        var routeLayer = {verb:method, handler:handler};
        route.stack.push(routeLayer);
      });
    } else {
      var routeLayer = {verb:verb, handler:handler};
      route.stack.push(routeLayer);
    }
    
  }

  route.handler = function(req,res,out) {
    var index = 0;
    var stack = this.stack;

    function next(error) {
      if(error == 'route'){
        stack =[];
        out();
      } else if(error){
        out(error);
      }
      
      var layer = stack[index++];
      if(layer){
        if(layer.verb.toLocaleUpperCase() == req.method) {
            layer.handler(req,res,next);
        } else {
          next();
        } 
      } else {
        res.statusCode = 404;
        res.end("404 Not Found");
      }
    }
    next();
  }

  return route;

}