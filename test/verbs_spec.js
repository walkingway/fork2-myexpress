var request = require("supertest")
  , expect = require("chai").expect
  , http = require("http");

var myexpress = require("../");

describe("App get method:",function(){
  var app;

  before(function() {
    app = myexpress();
    app.get("/foo",function(req,res) {
      res.end("foo");
    });
  });

  it("should respond for Get request",function(done) {
    request(app).get("/foo").expect("foo").end(done);
  });

  it("should 404 non GET request",function(done) {
    request(app).post("/foo").expect(404).end(done);
  });

  it("should 404 non whole path match",function(done) {
    request(app).get("/foo/bar").expect(404).end(done);
  });
});