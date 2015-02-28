/* alerts
 */

module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var twilio = require('twilio');

  var moment = require('moment');

  var nexmo = require('easynexmo');

  nexmo.initialize(
    config.gateway.key,
    config.gateway.secret,
    config.gateway.protocol,
    config.gateway.debug
  );

  var twilio = require('twilio');
  var client = new twilio.RestClient('AC843270d590f2988caf4993adb06e0294', 'bada3f2f91251f3c0f6edefe94022366');

  var create = function(req, res, next) {

    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();

    var name = req.body.name.trim();
    var userName = req.body.userName.trim();
    var companyName = req.body.message.trim();

    var message = req.body.message.trim();

    var number = req.body.number.replace(/[-() ]/gi, '');
    var startDate = new Date(req.body.start);
    var endDate = new Date(req.body.end);

    // TODO add multiple validations after transforms
    var errors = req.validationErrors();

    if (errors) {
      res.status(400).json(errors);
      return;
    }

    var event = {
      status: false,
      name: name,
      userName: userName,
      companyName: companyName,
      title: name,
      number: number,
      start: startDate,
      end: endDate,
      calendarId: req.params.calendarId,
      message: message
    };

    db.events.insert(event, function (err, newEvent) {

      res.json({
        message: 'Create successful.',
        event: newEvent
      });

    });

    var contact = {
      name: name,
      title: name,
      number: number,
      calendarId: req.params.calendarId
    };

    db.contacts.findOne({'name': contact.name, 'number': contact.number, 'calendarId': contact.calendarId}, function (err, doc) {

      if (err) {
        res.json(util.inspect(errors), 400);
        return;
      }

      if (!doc) {

        db.contacts.insert(contact, function (err, newContact) {
          
          if (err) {
            res.json(util.inspect(errors), 400);
            return;
          }

        });
      }
    });

  };

  var update = function (req, res, next) {
    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();
    req.checkBody('_id', 'ID should not be empty.').notEmpty();

    var name = req.body.name.trim();
    var number = req.body.number.replace(/[-() ]/gi, '');
    var startDate = Date.create(req.body.start);
    var endDate = Date.create(req.body.end);
    var message = req.body.message;
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
      calendarId: req.params.calendarId,
      message: message
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

  var remind = function (req, res, next) {

    var lte = moment().add(1, 'hours').toDate();
    var gte = moment().toDate();
    
    db.events.find({
      start: {
        $lte: lte,
        $gte: gte
      },
      sent: {
        $ne: true
      }
    }).sort(
    {
      start: -1
    }
    ).exec(function (err, alerts) {

      if (alerts.length) {

        alerts.forEach(function (alert) {
          
        
          client.sms.messages.create({
              
              to: alert.number,
              from:'+13475146545',
              body: alert.message + ' Reminded by Apunto'

          }, function(error, message) {

              // The HTTP request to Twilio will run asynchronously. This callback
              // function will be called when a response is received from Twilio
              // The "error" variable will contain error information, if any.
              // If the request was successful, this value will be "falsy"
              if (!error) {
                  // The second argument to the callback will contain the information
                  // sent back by Twilio for the request. In this case, it is the
                  // information about the text messsage you just sent:
                  db.events.update({
                    _id: alert._id
                  }, {
                    $set: {
                      sent: true,
                      twilioRes: message
                    }
                  }, {}, function(err, num, alert) {

                    res.json({
                      sid: message.sid,
                      dateCreated: message.dateCreated,
                      alert: alert
                    });

                  });
                  

              } else {
                
                res.json({
                  error: true,
                  errorObj: error
                });
                  
              }

          });

        });
      } else {
        res.json({
          alerts: []
        });
      }

    });

  };

  var sendAll = function(req, res, next) {

    // find alerts that had to be sent in the last two minutes
    // and have not been already sent
    
    console.log('send-all');
    res.json({resp: 'send-all'});

    // db.alerts.find({
    //   start: {
    //     $gte: moment().subtract(2, 'minutes').toDate(),
    //     $lte: moment().toDate()
    //   },
    //   set: {
    //     $ne: true
    //   }
    // }).sort({
    //   $ne: true
    // }).exec(function (err, alerts) {
    //   console.log(alerts);
    // });

    // db.alerts.find({
    //   start: {
    //     $gte: moment().subtract(2, 'minutes').toDate(),
    //     $lte: moment().toDate()
    //   },
    //   sent: {
    //     $ne: true
    //   }
    // }).sort({
    //   date: -1
    // }).exec(function (err, alerts) {

    //   if(err) {
    //     return res.send(err, 400);
    //   }

    //   // TODO integrate gateway and send alert
    //   // on success set sent true

    //   alerts.forEach(function(alert) {

    //     client.sms.messages.create({
    //         to:'+40755052956',
    //         from:'+13475146545',
    //         body:'ahoy hoy! Testing Twilio and node.js'
    //     }, function(error, message) {
    //         // The HTTP request to Twilio will run asynchronously. This callback
    //         // function will be called when a response is received from Twilio
    //         // The "error" variable will contain error information, if any.
    //         // If the request was successful, this value will be "falsy"
    //         if (!error) {
    //             // The second argument to the callback will contain the information
    //             // sent back by Twilio for the request. In this case, it is the
    //             // information about the text messsage you just sent:
    //             console.log('Success! The SID for this SMS message is:');
    //             console.log(message.sid);
         
    //             console.log('Message sent on:');
    //             console.log(message.dateCreated);
    //         } else {
    //             console.log(error);
    //             console.log('Oops! There was an error.');
    //         }
    //     });

    //     // client.makeCall({
    //     //   to:'+40743307087',
    //     //   from:'+13475146545',
    //     //   url:'http://demo.twilio.com/welcome/voice/'
    //     // }, function(err, call) {
    //     //     console.log('This call\'s unique ID is: ' + call.sid);
    //     //     console.log('This call was created at: ' + call.dateCreated);
    //     // });

    //     // nexmo.sendTextMessage(
    //     //   config.sender,
    //     //   alert.number,
    //     //   alert.message,
    //     //   {},
    //     //   function(err, response) {

    //     //     // set sent to true in db
    //     //     db.alerts.update({
    //     //       _id: alert._id
    //     //     }, {
    //     //       $set: {
    //     //         sent: true
    //     //       }
    //     //     }, {}, function(err, alert) {

    //     //       //console.log(alert);

    //     //     });

    //     //   });

    //   });

    //   res.json(alerts);

    // });

  };

  return {
    create: create,
    list: list,
    sendAll: sendAll,
    get: get,
    remove: remove,
    update: update,
    remind: remind
  };

};
