#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var expressValidator = require('express-validator');
  var bCrypt = require('bcrypt-nodejs');

  var async = require('async');
  var fs = require('fs');

  var sugar = require('sugar');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var basicAuth = require('basic-auth-connect');

  var app = express();

  
  // Configuring Passport
  var flash = require('connect-flash');
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  
  var expressSession = require('express-session');
  app.use(expressSession({
    secret: 'mySecretKey',
    saveUninitialized: true,
    resave: true       
  }));

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  // Generates hash using bCrypt
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  }

  // configs
  var config = require('./config/config.js');

  // Admin auth
  var adminAuth = basicAuth(function(user, pass, callback) {
    var admin = false;

    if(process.env.OPENSHIFT_APP_NAME) {
      admin = (user === config.admin.user && pass === config.admin.password);
    } else {
      admin = true;
    }

    callback(null, admin);
  });

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

  db.users = new Datastore({
    filename: config.dataDir + config.dbDir + '/users.db',
    autoload: true
  });

  // alert routes
  var alerts = require('./app/controllers/alerts.js')(config, db);

  app.get('/api/1/alerts', alerts.list);
  app.get('/api/1/alerts/send-all', alerts.sendAll);
  app.post('/api/1/alerts', alerts.create);

  // dashboard routes
  var dashboard = require('./app/controllers/dashboard.js')(config, db);

  app.get('/dashboard', adminAuth, dashboard.view);


  passport.serializeUser(function(user, done) {
    console.log('serializeUser');
    done(null, user);
  });
   
  passport.deserializeUser(function(user, done) {
    console.log('deserializeUser');
    done(null, user);
    // User.findById(id, function(err, user) {
    //   done(err, user);
    // });
  });

  passport.use('signup', new LocalStrategy({
      passReqToCallback : true
    },
    function (req, username, password, done) {
      var findOrCreateUser = function(){
        
        db.users.findOne({'username': username}, function (err, user) {
        
         if (err){
          
           return done(err);
         }

         if (user) {
          
           return done(null, false, 
             req.flash('message', 'User Already Exists'));

         } else {
           
           //if there is no user with that email
           // create the user
           var newUser = {};
           // set the user's local credentials
           newUser.username = username;
           newUser.password = createHash(password);
         
           // save the user
          db.users.insert(newUser);
          return done(null, newUser);
         }
        });
      } // findorcreateuser

      process.nextTick(findOrCreateUser);

    }
  ));

  // signup routes
  app.get('/signup', function(req, res, next) {

    res.render('signup', {info: req.flash("message")});
  });

  app.post('/signup', passport.authenticate('signup', {
    successRedirect: '/dashboard',
    failureRedirect: '/signup',
    failureFlash : true
  }));

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
