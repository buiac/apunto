#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var expressSession = require('express-session');

  // validation library for whatever comes in through the forms
  var expressValidator = require('express-validator');


  //var async = require('async');
  var fs = require('fs');

  var sugar = require('sugar');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var flash = require('connect-flash');
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;

  var app = express();
  
  app.use(expressSession({
    secret: 'mySecretKey',
    saveUninitialized: true,
    resave: true       
  }));

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());



  // Chekcs if user is authenticated
  var isAuthenticated = function (req,res,next){
     if (req.isAuthenticated()){
        return next(); 
     } else {
        res.redirect("/signin"); 
     }
  };

  // configs
  var config = require('./config/config.js');

  // config express
  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  }));

  app.use(expressValidator());

  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'ejs');

  app.use(express.static(__dirname + config.publicDir));

  app.use(errorhandler());

  // allow self-signed ssl
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // CORS headers
  app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

    next();
  });

  // datastore
  var Datastore = require('nedb');
  var db = {};

  db.alerts = new Datastore({
    filename: config.dataDir + config.dbDir + '/alerts.db',
    autoload: true
  });

  db.events = new Datastore({
    filename: config.dataDir + config.dbDir + '/events.db',
    autoload: true
  });

  db.users = new Datastore({
    filename: config.dataDir + config.dbDir + '/users.db',
    autoload: true
  });

  db.calendars = new Datastore({
    filename: config.dataDir + config.dbDir + '/calendars.db',
    autoload: true
  });

  // alert routes
  var events = require('./app/controllers/events.js')(config, db);

  app.get('/api/1/events/:calendarId', events.list);
  app.get('/api/1/events/:alertId', events.get);
  app.post('/api/1/:calendarId/events/', events.create);
  app.put('/api/1/:calendarId/events/:alertId', events.update);
  app.delete('/api/1/:calendarId/events/:alertId', events.remove);

  // send reminders
  app.get('/api/1/alerts/send-all', events.sendAll);

  // dashboard routes
  var dashboard = require('./app/controllers/dashboard.js')(config, db);

  //app.get('/dashboard', isAuthenticated , dashboard.view);

  app.get('/dashboard', isAuthenticated , dashboard.view);

  // auth routes
  var auth = require('./app/controllers/authenticate.js')(config, db);

  app.get('/signup', auth.signupView);

  app.post('/signup', auth.signup);

  app.get('/signin', auth.signinView);

  app.post('/signin', auth.signin);

  // Logout
  app.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/signin');
  });

  // start express server
  app.listen(config.port, config.ipAddress, function() {
    console.log(
      '%s: Node server started on %s:%d ...',
      Date(Date.now()),
      config.ipAddress,
      config.port
    );
  });


  return app;

}());
