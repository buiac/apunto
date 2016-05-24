module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var superadmin = require('./controllers/superadmin.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  router.get('/dashboard', util.adminAuth, superadmin.dashboard);
  router.get('/delete-user/:userId', util.adminAuth, superadmin.deleteUser);  

  return router;
}