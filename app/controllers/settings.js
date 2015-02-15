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
    req.checkBody('name', 'Name should not be empty').notEmpty();
    req.checkBody('userName', 'User name should not be empty').notEmpty();

    var name = req.body.name.trim();
    var companyName = req.body.companyName.trim();
    var userName = req.body.userName.trim();
    var userId = req.body._id;


    db.users.update({
      _id: userId
    }, {
      $set: {
        name: name,
        companyName: companyName,
        username: userName
      }
    }, {}, function(err, num, user) {

      if (err) {
        res.send({error: err}, 400);
      }

      res.json({
        user: user
      });

    });


  };

  return {
    view: view,
    update: update
  };

};
