module.exports = function (db) {
  var express = require('express');
  var router = express.Router();
  var config = require('../data/config.js');
  var util = require('./services/util.js')(config, db);
  var events = require('./controllers/events.js')(config, db);

  // middleware that is specific to this router
  router.use(function timeLog(req, res, next) {
    console.log('events-routes. Time: ', Date.now());
    next();
  });

  router.get('/:calendarId', events.list);
  router.post('/:calendarId', events.create);
  router.put('/:calendarId/', events.update);
  router.delete('/:calendarId/:eventId', events.remove);

  router.get('/r/remind/', events.remind);
  router.get('/r/confirm/:eventId/:status', events.confirm);

  return router;
}