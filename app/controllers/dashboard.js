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
      
      if (calendar) {
        
        request
        .get(config.ipAddress + ':' + config.port + '/api/1/alerts/' + calendar._id)
        .end(function(err, response){
          
          res.render('dashboard', {
            alerts: response.body,
            user: req.user,
            calendar: calendar
          });

        });

      }

    });
  };

  return {
    view: view
  };

};
