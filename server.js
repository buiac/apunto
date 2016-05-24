#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var expressSession = require('express-session');
  var nconf = require('nconf');

  // validation library for whatever comes in through the forms
  var expressValidator = require('express-validator');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var flash = require('connect-flash');
  var passport = require('passport');
  
  var LocalStrategy = require('passport-local').Strategy;
  var moment = require('moment');

  var app = express();

  app.use(function(req, res, next){
    res.locals.moment = moment;
    next();
  });

  var config = require(((process.env.OPENSHIFT_APP_NAME) ? '../' : './') + 'data/config.js');
  var datastore = require('./app/datastore.js');
  var db = datastore(config).db
  var dashboardRoutes = require('./app/dashboard-routes.js')(db);
  var settingsRoutes = require('./app/settings-routes.js')(db);
  var settingsRoutesApi = require('./app/settings-routes-api.js')(db);
  var eventsRoutesApi = require('./app/events-routes-api.js')(db);
  var contactsRoutesApi = require('./app/contacts-routes-api.js')(db);
  var authRoutes = require('./app/auth-routes.js')(db);
  var saRoutes = require('./app/sa-routes.js')(db);

  // config express
  app.use(expressSession({
    secret: config.sessionSecret,
    saveUninitialized: true,
    resave: true
  }));

  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  }));

  app.use(expressValidator());

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

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
  
  // Routes
  app.use('/dashboard', dashboardRoutes);
  app.use('/settings', settingsRoutes);
  app.use('/auth', authRoutes);
  app.use('/sa', saRoutes);
  app.use('/api/1/events', eventsRoutesApi);
  app.use('/api/1/settings', settingsRoutesApi);
  app.use('/api/1/contacts', contactsRoutesApi);
  
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
