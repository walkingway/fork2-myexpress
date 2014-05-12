function Layer(initToPath,fn){
  this.handle = fn;
  this.layerPath = initToPath;
  
  Layer.prototype.match = function(toPath){
    if(toPath.indexOf(this.layerPath) == 0) {
      var result = {path: this.layerPath};
      return result;
    } 
  }  
}

module.exports = Layer;