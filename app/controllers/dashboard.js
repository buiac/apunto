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

    request
    .get(config.ipAddress + ':' + config.port + '/api/1/alerts')
    .end(function(err, response){

      res.render('dashboard', {
        alerts: response.body,
        user: req.user
      });

    });

  };

  return {
    view: view
  };

};
