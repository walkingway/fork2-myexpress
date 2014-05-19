var request = require("supertest")
  , expect = require("chai").expect
  , http = require("http");

var express = require("../");

describe("Monkey patch req and res",function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("adds isExpress to req and res",function(done) {
    var _req, _res;
    app.use(function(req,res) {
      app.monkey_patch(req,res);
      _req = req;
      _res = res;
      res.end(req.isExpress + "," + res.isExpress);
    });

    request(app).get("/").expect("true,true").end(function() {
      expect(_res).to.not.have.ownProperty('isExpress');
      expect(_req).to.not.have.ownProperty('isExpress');
      done();
    });
  });
});

describe("Monkey patch before serving",function() {
  var app;
  beforeEach(function() {
    app = express();
    app.use(function(req,res) {
      res.end(req.isExpress + "," + res.isExpress);
    });
  });

  it("adds isExpress to req and res",function(done) {
    request(app).get("/").expect("true,true").end(done);
  });
});

describe("Setting req.app",function() {
  var app;
  beforeEach(function() {
    app = express();

  });

  it("sets req.app when entering an app",function(done) {
    var _app;
    app.use(function(req,res) {
      _app = req.app;
      res.end("ok");
    });
    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app);
      done();
    });
  });

  it("resets req.app to parent app when exiting a subapp",function(done) {
    var _app, _subapp;
    var subapp = express();

    subapp.use(function(req,res,next) {
      _subapp = req.app; // => subapp
      next();
    });
    app.use(subapp);
    app.use(function(req,res) {
      _app = req.app;
      res.end("ok");
    });

    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app,"req.app is not restored to parent");
      expect(_subapp).to.equal(subapp);
      done();
    });
  });
});
