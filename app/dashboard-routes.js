module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var dashboard = require('./controllers/dashboard.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    next();
  });

  router.get('/', util.isAuthenticated , dashboard.view);

  return router;
}