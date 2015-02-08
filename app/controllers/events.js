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
    //req.checkBody('calendarId', 'Looks like there is no calendar selected.').notEmpty();

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

    var alert = {
      status: false,
      name: name,
      title: name,
      number: number,
      start: startDate,
      end: endDate,
      message: message,
      calendarId: req.params.calendarId
    };

    db.alerts.insert(alert, function (err, newAlert) {

      res.json({
        message: 'Create successful.',
        alert: newAlert
      });

    });

  };

  var update = function (req, res, next) {
    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('id', 'ID should not be empty.').notEmpty();
    //req.checkBody('calendarId', 'Looks like there is no calendar selected.').notEmpty();

    var name = req.body.name.trim();
    var number = req.body.number.replace(/[-() ]/gi, '');
    var message = req.body.message.trim();
    var startDate = Date.create(req.body.start);
    var endDate = Date.create(req.body.end);
    var alertId = req.body.id;

    startDate = moment(startDate).toDate();
    endDate = moment(endDate).toDate();

    // TODO add multiple validations after transforms

    var errors = req.validationErrors();

    if (errors) {
      res.json(util.inspect(errors), 400);
      return;
    }

    var alert = {
      status: false,
      name: name,
      title: name,
      number: number,
      start: startDate,
      end: endDate,
      message: message,
      calendarId: req.params.calendarId
    };

    db.alerts.update({'_id': alertId}, alert, function (err, num, newAlert) {

      if (num > 0) {
        db.alerts.findOne({'_id': alertId}, function (err, doc) {
          res.json({
            message: 'Update successfull.',
            alert: doc
          });
        });        
      }
      

    });
  }

  var list = function(req, res, next) {

    db.alerts.find({
      calendarId: req.params.calendarId
    }).sort({
      date: -1
    }).exec(function (err, alerts) {

      if(err) {
        return res.send(err, 400);
      }

      if (!alerts.length) {
        alerts = [];
      }

      res.json(alerts);

    });

  };

  var get = function(req, res, next) {

    db.alerts.findOne({
      _id: req.params.alertId
    }).exec(function (err, alert) {

      if(err) {
        return res.send(err, 400);
      }

      if (!alert) {
        alerts = {};
      }

      res.json(alert);

    });

  };

  var remove = function(req, res, next) {
    var id = req.params.alertId;
    db.alerts.remove({
      _id: req.params.alertId
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
