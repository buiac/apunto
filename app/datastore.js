module.exports = function(config) {
  'use strict';
  var Datastore = require('nedb');
  var db = {};

  db.alerts = new Datastore({
    filename: config.dataDir + config.dbDir + '/alerts.db',
    autoload: true
  });

  db.events = new Datastore({
    filename: config.dataDir + config.dbDir + '/events.db',
    autoload: true
  });

  db.users = new Datastore({
    filename: config.dataDir + config.dbDir + '/users.db',
    autoload: true
  });

  db.calendars = new Datastore({
    filename: config.dataDir + config.dbDir + '/calendars.db',
    autoload: true
  });

  db.contacts = new Datastore({
    filename: config.dataDir + config.dbDir + '/contacts.db',
    autoload: true
  });

  db.templates = new Datastore({
    filename: config.dataDir + config.dbDir + '/templates.db',
    autoload: true
  });

  return {
    db: db
  };
};