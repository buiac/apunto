#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var expressSession = require('express-session');

  // validation library for whatever comes in through the forms
  var expressValidator = require('express-validator');

  // cryptation library
  var bCrypt = require('bcrypt-nodejs');


  //var async = require('async');
  var fs = require('fs');

  //var sugar = require('sugar');

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

  // Generates hash using bCrypt
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

  // Chekcs if user is authenticated
  var isAuthenticated = function (req,res,next){
     if (req.isAuthenticated()){
        return next(); 
     } else {
        res.redirect("/signin"); 
     }
  };

  var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
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

  db.users = new Datastore({
    filename: config.dataDir + config.dbDir + '/users.db',
    autoload: true
  });

  db.calendars = new Datastore({
    filename: config.dataDir + config.dbDir + '/calendars.db',
    autoload: true
  });

  // alert routes
  var alerts = require('./app/controllers/alerts.js')(config, db);

  app.get('/api/1/alerts', alerts.list);
  app.get('/api/1/alerts/send-all', alerts.sendAll);
  app.post('/api/1/alerts', alerts.create);

  // dashboard routes
  var dashboard = require('./app/controllers/dashboard.js')(config, db);

  app.get('/dashboard', isAuthenticated , dashboard.view);


  // passport signup / login
  passport.serializeUser(function(user, done) {

    done(null, user._id);
  });
   
  passport.deserializeUser(function(userId, done) {

    db.users.findOne({'_id':userId}, function (err, newUser) {
      
      done(err, newUser);

    });

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
          db.users.insert(newUser, function (err, newDoc) {
            
            if (err) {
              return done(err);
            } else {
              return done(null, newDoc);  
            }
          });

         }
        });
      } // findorcreateuser

      process.nextTick(findOrCreateUser);

    }
  ));

  

  passport.use('signin', new LocalStrategy({
      passReqToCallback : true
    },
    function (req, username, password, done) {
      
        
      db.users.findOne({'username': username}, function (err, user) {

        if (err){

         return done(err);
        }

        if (!user) {

         return done(null, false, 
           req.flash('message', 'User does not exist'));

        }

        if (!isValidPassword(user, password)) {
          return done(null, false, 
            req.flash('message', 'Invalid Password'));
        }

        return done(null, user);

      });

    }
  ));

  // signup routes
  app.get('/signup', function(req, res, next) {

    res.render('signup', {
      info: req.flash("message"),
      userr: {
        name: 'sebi.kovacs+' + new Date().getTime() + '@gmail.com',
        pass: 'passpass'
      }
    });

  });

  app.post('/signup', passport.authenticate('signup', {
    successRedirect: '/dashboard',
    failureRedirect: '/signup',
    failureFlash : true
  }));



  // signin routes
  app.get('/signin', function(req, res, next) {

    res.render('signin', {info: req.flash("message")});
    
  });

  app.post('/signin', passport.authenticate('signin', {
    successRedirect: '/dashboard',
    failureRedirect: '/signin',
    failureFlash : true
  }));

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
