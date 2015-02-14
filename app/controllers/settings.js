/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var passport = require('passport');

  

  var view = function(req, res, next) {
    console.log(req.user._id);

    db.users.findOne({'_id': req.user._id}, function (err, user) {

      if (!user) {
        res.send({error: err}, 400);
      }
      
      if (user) {
        
        res.render('settings', {
          user: user,
        });

      }

    });
  };

  var update = function (req, res, next) {
    // body...
  };

  return {
    view: view,
    update: update
  };

};
