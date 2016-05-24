module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var settings = require('./controllers/settings.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  router.get('/:userId', util.isAuthenticated, settings.getUser);
  router.get('/templates/:userId', util.isAuthenticated, settings.templates)

  return router;
}