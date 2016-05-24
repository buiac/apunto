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
    db.calendars.findOne({'userId': req.user._id}, function (err, calendar) {

      if (!calendar) {
        res.send({error: 'error'}, 400);
      }
          
      res.render('dashboard', {
        user: req.user,
        calendar: calendar
      });
    });
  };

  return {
    view: view
  };

};
