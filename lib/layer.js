function Layer(initToPath,fn){
  this.handle = fn;

  function trialingSlash(str){
    if(str.substr(str.length-1, 1) == "/")
    str = str.substr(0,str.length-1);
    return str;
  }
  this.layerPath = trialingSlash(initToPath);
  

  Layer.prototype.match = function(toPath){
    var p2re = require("path-to-regexp");
    var names = [];
    re = p2re(this.layerPath,names,{end: false});
    if(re.test(toPath)){
      var m = re.exec(decodeURIComponent(toPath));
      var params = {};
      if(names[0])
        params[names[0].name] = m[1];
      if(names[1])
        params[names[1].name] = m[2];
      
      var result = {path:m[0],params:params};
      return result;
    }
  }  
}

module.exports = Layer;