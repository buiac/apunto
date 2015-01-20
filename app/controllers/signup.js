module.exports = function(config, db) {
	var express = require('express');
  var expressSession = require('express-session');

  var expressValidator = require('express-validator');
  var bCrypt = require('bcrypt-nodejs');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var flash = require('connect-flash');
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;

  // Generates hash using bCrypt
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

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
          var calendar = {}

          // set the user's local credentials
          newUser.username = username;
          newUser.password = createHash(password);

          // set calendar default name
          calendar.name = 'Default name';

           // save the user
          db.users.insert(newUser, function (err, newDoc) {
            
            if (err) {
              return done(err);
            } else {

              // insert the calendar
              calendar.userId = newDoc._id;
              db.calendars.insert(calendar);

              return done(null, newDoc);  
            }
          });

         }
        });
      } // findorcreateuser

      process.nextTick(findOrCreateUser);

    }
  ));

  var signup = passport.authenticate('signup', {
    successRedirect: '/dashboard',
    failureRedirect: '/signup',
    failureFlash : true
  });

  var view = function(req, res, next) {

    res.render('signup', {
      info: req.flash("message"),
      userr: {
        name: 'sebi.kovacs+' + new Date().getTime() + '@gmail.com',
        pass: 'passpass'
      }
    });

  };


  return {
    view: view,
    signup: signup
  };

};