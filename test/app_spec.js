var request = require("supertest")
  , expect = require("chai").expect
  , http = require("http");

var express = require("../");

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

describe(".use",function(){
  var app;
  var m1 = function(){};
  var m2 = function(){};
  before(function(){
    app = express();
  });

  it("should be able to add middlewares to stack",function(){
    app.use(m1);
    app.use(m2);
    expect(app.stack.length).to.eql(2);
  });
});

describe("calling middleware stack",function() {
  var app;
  beforeEach(function() {
    app = new myexpress();
  });
  
  it("Should be able to call a single middleware",function(){
    var m1 = function(req,res,next) {
      res.end("hello from m1");
    };
    app.use(m1);
    request(qpp).get("/").expect("hello from m1").end(done);

  });

  // test cases
});

describe("Implement calling the middlewares",function(){
  var app;
  beforeEach(function() {
    app = express();
  });

  it("should be able to call a single middleware",function(done) {
    var m1 = function(req,res,next) {
      res.end("hello from m1");
    };
    app.use(m1);
    request(app).get("/").expect("hello from m1").end(done);
  });

  it("should be able a call 'next' to go to the next middleware",function(done){
    var calls = [];
    var m1 = function(req,res,next){
      calls.push("m1");
      next();
    };

    var m2 = function(req,res,next){
      calls.push("m2");
      res.end("hello from m2");
    };

    app.use(m1);
    app.use(m2);
    request(app).get("/").expect("hello from m2").end(function(err) {
      expect(calls).to.deep.equal(["m1","m2"]);
      done(err);
    });
  });

  it("should 404 at the end of middleware chain",function(done) {
    var m1 = function(req,res,next){
      next();
    };

    var m2 = function(req,res,next){
      next();
    };
    request(app).get("/").expect(404).end(done);
  });

  it("should 404 if no middleware is added",function(done){
    request(app).get("/").expect(404).end(done);
  });
});