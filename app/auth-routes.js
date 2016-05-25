'use strict';
module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require(((process.env.OPENSHIFT_APP_NAME) ? '../../' : '../') + 'data/config.js');
  var auth = require('./controllers/authenticate.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  router.get('/signup', auth.signupView);
  router.post('/signup', auth.signup);
  router.get('/signin', auth.signinView);
  router.post('/signin', auth.signin);
  router.get('/signout', auth.signout);

  return router;
};