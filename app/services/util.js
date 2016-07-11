/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

  var basicAuth = require('basic-auth-connect');
  var bCrypt = require('bcrypt-nodejs');

  // Generates hash using bCrypt
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

  var isAuthenticated = function (req, res, next) {
    if (false) {
      db.users.findOne({
       username: 'sebi.kovacs@gmail.com'
      }, function (err, user) {
        if (user) {
          
          req.user = user;
          return next();

        } else {
          db.users.insert({
            timecreated: new Date(),
            username: 'sebi.kovacs@gmail.com',
            password: createHash('passpass'),
            name: 'John Snow',
            companyName: 'GOT Industries'
          }, function (err, newUser) {
            req.user = newUser;
            return next();       
          });
        }
      });

    } else {

     if (req.isAuthenticated()){
       return next();
     } else {
       res.redirect('/auth/signin'); 
     }
    }
  };

  var adminAuth = basicAuth(function(user, pass, callback) {
    var admin = false;

    admin = (user === config.superadmin.user && pass === config.superadmin.pass);

    callback(null, admin);
  });
  

  return {
    isAuthenticated: isAuthenticated,
    adminAuth: adminAuth,
    createHash: createHash
  };
};