module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var settings = require('./controllers/settings.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('settings-routes. Time: ', Date.now());
    next();
  });

  router.get('/account', util.isAuthenticated, settings.view);
  router.post('/account', util.isAuthenticated, settings.update);
  router.get('/templates', util.isAuthenticated, settings.templatesView)
  router.post('/templates', util.isAuthenticated, settings.addTemplate)
  router.get('/templates/:id', util.isAuthenticated, settings.deleteTemplate)

  return router;
}