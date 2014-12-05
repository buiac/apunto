#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var expressValidator = require('express-validator');

  var async = require('async');
  var fs = require('fs');

  var sugar = require('sugar');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var basicAuth = require('basic-auth-connect');

  var app = express();

  // configs
  var config = require('./config/config.js');

  // Admin auth
  var adminAuth = basicAuth(function(user, pass, callback) {
    var admin = false;
    if(process.env.OPENSHIFT_APP_NAME) {
      admin = (user === config.admin.user && pass === config.admin.password);
    } else {
      admin = true;
    }

    callback(null, admin);
  });

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

  // alert routes
  var alerts = require('./app/controllers/alerts.js')(config, db);

  app.get('/api/1/alerts', alerts.list);
  app.get('/api/1/alerts/send-all', alerts.sendAll);
  app.post('/api/1/alerts', alerts.create);

  // dashboard routes
  var dashboard = require('./app/controllers/dashboard.js')(config, db);

  app.get('/dashboard', dashboard.view);

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
