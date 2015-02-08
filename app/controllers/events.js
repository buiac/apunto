/* alerts
 */

module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');

  var moment = require('moment');

  var nexmo = require('easynexmo');

  nexmo.initialize(
    config.gateway.key,
    config.gateway.secret,
    config.gateway.protocol,
    config.gateway.debug
  );

  var create = function(req, res, next) {

    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();

    var name = req.body.name.trim();
    var number = req.body.number.replace(/[-() ]/gi, '');
    var message = req.body.message.trim();
    var startDate = Date.create(req.body.start);
    var endDate = Date.create(req.body.end);

    startDate = moment(startDate).toDate();
    endDate = moment(endDate).toDate();

    // TODO add multiple validations after transforms

    var errors = req.validationErrors();

    if (errors) {
      res.json(util.inspect(errors), 400);
      return;
    }

    var event = {
      status: false,
      name: name,
      title: name,
      number: number,
      start: startDate,
      end: endDate,
      message: message,
      calendarId: req.params.calendarId
    };

    db.events.insert(event, function (err, newEvent) {

      res.json({
        message: 'Create successful.',
        event: newEvent
      });

    });

  };

  var update = function (req, res, next) {
    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('_id', 'ID should not be empty.').notEmpty();

    var name = req.body.name.trim();
    var number = req.body.number.replace(/[-() ]/gi, '');
    var message = req.body.message.trim();
    var startDate = Date.create(req.body.start);
    var endDate = Date.create(req.body.end);
    var eventId = req.body._id;

    startDate = moment(startDate).toDate();
    endDate = moment(endDate).toDate();

    // TODO add multiple validations after transforms

    var errors = req.validationErrors();

    if (errors) {
      res.json(util.inspect(errors), 400);
      return;
    }

    var event = {
      status: false,
      name: name,
      title: name,
      number: number,
      start: startDate,
      end: endDate,
      message: message,
      calendarId: req.params.calendarId
    };

    db.events.update({'_id': eventId}, event, function (err, num, newEvent) {
      
      if (num > 0) {
        
        db.events.findOne({'_id': eventId}, function (err, doc) {

          res.json({
            message: 'Update successfull.',
            event: doc
          });

        });

      } else {

        res.json(util.inspect(errors), 400);

      }

    });
  }

  var list = function(req, res, next) {

    db.events.find({
      calendarId: req.params.calendarId
    }).sort({
      date: -1
    }).exec(function (err, events) {

      if(err) {
        return res.send(err, 400);
      }

      if (!events.length) {
        events = [];
      }

      res.json(events);

    });

  };

  var get = function(req, res, next) {

    db.events.findOne({
      _id: req.params.eventId
    }).exec(function (err, event) {

      if(err) {
        return res.send(err, 400);
      }

      if (!alert) {
        event = {};
      }

      res.json(event);

    });

  };

  var remove = function(req, res, next) {
    var id = req.params.alertId;
    db.events.remove({
      _id: req.params.eventId
    },function (err, num) {

      if(err) {
        return res.send(err, 400);
      }

      res.json({message: 'Delete successful ' + id, num: num});

    });

  };

  var sendAll = function(req, res, next) {

    // find alerts that had to be sent in the last two minutes
    // and have not been already sent

    db.alerts.find({
      date: {
        $gte: moment().subtract(2, 'minutes').toDate(),
        $lte: moment().toDate()
      },
      sent: {
        $ne: true
      }
    }).sort({
      date: -1
    }).exec(function (err, alerts) {

      if(err) {
        return res.send(err, 400);
      }

      // TODO integrate gateway and send alert
      // on success set sent true

      alerts.forEach(function(alert) {

        nexmo.sendTextMessage(
          config.sender,
          alert.number,
          alert.message,
          {},
          function(err, response) {

            // set sent to true in db
            db.alerts.update({
              _id: alert._id
            }, {
              $set: {
                sent: true
              }
            }, {}, function(err, alert) {

              //console.log(alert);

            });

          });

      });

      res.json(alerts);

    });

  };

  return {
    create: create,
    list: list,
    sendAll: sendAll,
    get: get,
    remove: remove,
    update: update
  };

};
