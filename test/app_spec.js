describe("app",function(){
  describe("create http server",function(){
    var app = express();
    it("create your http server",function(done){
      var server = http.createServer();
      request(server).get('/bar').expect(404).end(done);
    });
  });

  describe("#listen",function() {
    var port = 7000;
    var server;
    before(function(done) {
      server = app.listen(port,done);
    });
    it("should return an http.Server",function(){
      expect(server).to.be.instanceof(http.server);
    });
    it("responds to /foo with 404",function(done){
      request("http://localhost:7000").get("/foo").expect(404).end(done);
    });
  });
});