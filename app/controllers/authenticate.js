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

  // Mailgun configuration
  var Mailgun = require('mailgun-js');
  var mailgun_api_key = config.mailgun.apikey;
  var domain = 'getapunto.com';
  var mailgun = new Mailgun({apiKey: mailgun_api_key, domain: domain});

  // Generates hash using bCrypt
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

  // passport serializer
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
          var newUser = {
            timecreated: new Date()
          };

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

              var reminderEmailConfig = {
                from: 'contact@getapunto.com', // user.username
                to: 'contact@getapunto.com',
                subject: 'new signup',
                html: '<p>username: ' + newDoc.username
              };

              //Invokes the method to send emails given the above data with the helper library
              mailgun.messages().send(reminderEmailConfig, function (err, body) {
                  //If there is an error, render the error page
                  if (err) {
                    console.log('----error mailgun----')
                    console.log("got an error: ", err);
                  }
                  //Else we can greet and leave
                  else {
                    console.log('----success mailgun----')
                    console.log(body);
                  }
              });

              db.templates.insert({
                name: 'Default template',
                message: 'Reminder: you have an appointment on {date} starting at {time} with {full_name} from {company_name}.',
                userId: newDoc._id
              })

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

  var signupView = function(req, res, next) {

    res.render('signup', {
      info: req.flash("message")
    });

  };

  // helper methods
  var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
  };

  // passport signin method
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

  var signin = passport.authenticate('signin', {
    successRedirect: '/dashboard',
    failureRedirect: '/signin',
    failureFlash : true
  });

  var signinView = function(req, res, next) {

    res.render('signin', {info: req.flash("message")});
    
  };


  return {
    signupView: signupView,
    signup: signup,
    signinView: signinView,
    signin: signin
  };

};