/* alerts
 */

module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');

  var moment = require('moment-timezone');

  var nexmo = require('easynexmo');
  nexmo.initialize(
    config.gateway.key,
    config.gateway.secret,
    config.gateway.protocol,
    config.gateway.debug
  );

  function toMomentInTimezone(sourceMoment, timezone) {
    var result = moment.tz(timezone);
    result.year(sourceMoment.year());
    result.month(sourceMoment.month());
    result.date(sourceMoment.date());
    result.hour(sourceMoment.hour());
    result.minute(sourceMoment.minute());
    result.second(sourceMoment.second());
    result.millisecond(sourceMoment.millisecond());
    return result;
  }

  var create = function(req, res, next) {

    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('date', 'Date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();

    var number = req.body.number.replace(/[-() ]/gi, '');

    var message = req.body.message.trim();

    var date = Date.create(req.body.date);

    // TODO timezone not working right?
    date = moment(date).clone().tz(config.timezone).toDate();

    // TODO add multiple validations after transforms

    var errors = req.validationErrors();
    if (errors) {
      res.send(util.inspect(errors), 400);
      return;
    }

    var alert = {
      sent: false,
      number: number,
      date: date,
      message: message
    };

    db.alerts.insert(alert);

    res.json(alert);

  };

  var list = function(req, res, next) {

    db.alerts.find({
    }).sort({
      date: -1
    }).exec(function (err, alerts) {

      if(err) {
        return res.send(err, 400);
      }

      res.json(alerts);

    });

  };

  var sendAll = function(req, res, next) {

    // find alerts to be sent in the next minute
    // and have not been already sent

    db.alerts.find({
      date: {
        $gte: moment().tz(config.timezone).toDate(),
        $lte: moment().tz(config.timezone).add(1, 'minutes').toDate()
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
    sendAll: sendAll
  };

};
