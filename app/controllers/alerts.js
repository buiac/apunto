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

    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('date', 'Date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();

    var number = req.body.number.replace(/[-() ]/gi, '');

    var message = req.body.message.trim();

    var date = Date.create(req.body.date);

    date = moment(date).toDate();

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

    res.redirect('/dashboard');

  };

  var list = function(req, res, next) {

    console.log(req.user);

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
    sendAll: sendAll
  };

};
