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
       username: 'platon_n@yahoo.com'
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

  var clone = function (obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }
  

  return {
    isAuthenticated: isAuthenticated,
    adminAuth: adminAuth,
    createHash: createHash,
    clone: clone
  };
};