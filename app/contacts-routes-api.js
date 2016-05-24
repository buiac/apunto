module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var contacts = require('./controllers/contacts.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  router.get('/:calendarId', util.isAuthenticated, contacts.list);
  router.post('/:calendarId', util.isAuthenticated, contacts.updateContact);
  router.get('/:calendarId/delete/:contactId', util.isAuthenticated, contacts.deleteContact);

  return router;
}