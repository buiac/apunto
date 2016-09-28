/* alerts
 */

module.exports = function(config, db) {
  'use strict';

  var util = require('util');
  var utils = require('../services/util.js')(config, db);
  var twilio = require('twilio');
  var moment = require('moment');
  var nexmo = require('easynexmo');
  var path = require('path');

  var EmailTemplate = require('email-templates').EmailTemplate;
  var templateDir = path.join(config.emailTemplates.folder, 'confirmation');
  var confirmation = new EmailTemplate(templateDir);

  nexmo.initialize(
    config.gateway.key,
    config.gateway.secret,
    config.gateway.protocol,
    config.gateway.debug
  );

  // Setup twilio
  var client = new twilio.RestClient(config.twilio.key, config.twilio.secret);

  // Mailgun configuration
  var Mailgun = require('mailgun-js');
  var mailgun_api_key = config.mailgun.apikey;
  var domain = 'getapunto.com';
  var mailgun = new Mailgun({apiKey: mailgun_api_key, domain: domain});

  var create = function(req, res) {
    req.checkBody('name', 'Please enter the name of your client.').notEmpty();
    req.checkBody('number', 'Please enter client phone number.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();

    if (req.body.repeatActive) {
      req.checkBody('repeatInterval', 'Please set message repeat interval.').notEmpty();
      req.checkBody('repeatStartDate', 'Please set the date when the message repeat should start.').notEmpty();
    }

    var name = req.body.name.trim();
    var userName = req.body.userName.trim();
    var companyName = req.body.companyName.trim();

    var message = req.body.message.trim();

    var number = req.body.number.replace(/[-() ]/gi, '');
    var startDate = new Date(req.body.start);
    var endDate = new Date(req.body.end);
    var reminderDate = new Date(req.body.reminderDate);
    var email = req.body.email;

    if (req.body.repeatActive) {
      var repeatActive = req.body.repeatActive;
      var repeatInterval = req.body.repeatInterval;
      var repeatStartDate = req.body.repeatStartDate;
    }

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
      message: message,
      templateId: req.body.templateId,
      reminderDate: reminderDate,
      email: email, 
      repeatActive: repeatActive,
      repeatInterval: repeatInterval,
      repeatStartDate: repeatStartDate
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
      email: email,
      calendarId: req.params.calendarId
    };

    db.contacts.findOne({
      name: contact.name,
      number: contact.number,
      calendarId: contact.calendarId
    }, function (err, doc) {

      if (err) {
        res.json(util.inspect(errors), 400);
        return;
      }

      if (!doc) {
        db.contacts.insert(contact, function (err) {
          if (err) {
            res.json(util.inspect(errors), 400);
            return;
          }
        });
      }
    });
  };

  var update = function (req, res) {
    req.checkBody('name', 'Title should not be empty').notEmpty();
    req.checkBody('number', 'Number should not be empty.').notEmpty();
    req.checkBody('start', 'Start date should not be empty.').notEmpty();
    req.checkBody('end', 'End date should not be empty.').notEmpty();
    req.checkBody('message', 'Message should not be empty.').notEmpty();
    req.checkBody('_id', 'ID should not be empty.').notEmpty();

    if (req.body.repeatActive) {
      req.checkBody('repeatInterval', 'Please set message repeat interval.').notEmpty();
      req.checkBody('repeatStartDate', 'Please set the date when the message repeat should start.').notEmpty();
    }
    
    var name = req.body.name.trim();
    var companyName = req.body.companyName.trim();
    var number = req.body.number.replace(/[-() ]/gi, '');
    var email = req.body.email.trim();
    var startDate = new Date(req.body.start);
    var endDate = new Date(req.body.end);
    var message = req.body.message;
    var eventId = req.body._id;
    var templateId = req.body.templateId;
    var reminderDate = new Date(req.body.reminderDate);

    startDate = moment(startDate).toDate();
    endDate = moment(endDate).toDate();

    // TODO add multiple validations after transforms

    if (req.body.repeatActive) {
      var repeatActive = req.body.repeatActive;
      var repeatInterval = req.body.repeatInterval;
      var repeatStartDate = req.body.repeatStartDate;
    }

    var errors = req.validationErrors();

    if (errors) {
      res.json(util.inspect(errors), 400);
      return;
    }

    var event = {
      status: false,
      name: name,
      email: email,
      title: name,
      number: number,
      companyName: companyName,
      start: startDate,
      end: endDate,
      calendarId: req.params.calendarId,
      message: message,
      templateId: templateId,
      reminderDate: reminderDate,
      repeatActive: repeatActive,
      repeatInterval: repeatInterval,
      repeatStartDate: repeatStartDate
    };

    db.events.update({'_id': eventId}, event, function (err, num) {
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
  };

  var list = function(req, res) {
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

  var remove = function(req, res) {
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

  var remind = function (req, res) {
    var lte = moment().add(15, 'minutes').toDate();
    var gte = moment().toDate();
  
    db.events.find({
      reminderDate: {
        $lte: lte,
        $gte: gte
      },
      sent: {
        $ne: true
      }
    }).sort({
      start: -1
    }).exec(function (err, alerts) {

      if (alerts.length) {

        alerts.forEach(function (alert) {
          // handle email alerts
          if (alert.email) {
            var confirmUrl = config.baseUrl +'/api/1/events/r/confirm/' + alert._id;

            var urls = {
              urlConfirm: confirmUrl  + '/1',
              urlCancel: confirmUrl + '/0'
            };

            confirmation.render(urls, function (err, result) {
              if (err) {
                console.log('---err-----');
                console.log(err);
                
                return;
              }

              var reminderEmailConfig = {
                from: config.sender.email, // user.username
                to: alert.email,
                subject: alert.companyName + ' - appointment reminder',
                html: result.html
              };

              //Invokes the method to send emails given the above data with the helper library
              mailgun.messages().send(reminderEmailConfig, function (err, body) {
                //If there is an error, render the error page
                if (err) {
                  console.log('----error mailgun----');
                  console.log('got an error: ', err);
                } else {  
                  console.log('----success mailgun----');
                  console.log(body);
                }
              });
            });
          }

          // if it's a recurring event clone it and add it to the calendar
          if (alert.repeatActive) {
            // clone alert
            var newAlert = utils.clone(alert)

            // delete the alert ID before inserting into the database
            delete newAlert._id

            // update the repeatStartDate attribute with the hours and minutes of the event
            newAlert.repeatStartDate = moment(newAlert.repeatStartDate).hours(moment(newAlert.start).hours()).minutes(moment(newAlert.start).minutes()).toDate()
            
            // add number of months
            newAlert.start = moment(newAlert.repeatStartDate).add(newAlert.repeatInterval, 'months').toDate()
            newAlert.end = moment(newAlert.repeatStartDate).add(newAlert.repeatInterval, 'months').add(1, 'hour').toDate()
            newAlert.reminderDate = newAlert.start
            newAlert.repeatStartDate = newAlert.start

            db.events.insert(newAlert, function (err, obj) {
              console.log('error')
              console.log(err)
              console.log('inserted a new event')
              console.log(obj)
            })
          }

          // check if the user has a valid pro account and use it
          db.calendars.findOne({
            _id: alert.calendarId
          }, function (err, calendar) {
            if (err) {
              // handle error
            }

            if (calendar) {
              // find user
              db.users.findOne({
                _id: calendar.userId
              }, function (err, user) {
                if (err) {
                  // handle error
                }

                if (user && user.payment && user.payment.type === 'pro') {
                  var daysLeft = moment(new Date(user.payment.endDate)).diff(new Date(), 'days')

                  if (daysLeft >= 0 ) {
                    
                    // truncate string
                    var alertMessage = alert.message;
                    alertMessage = alertMessage.substring(0, 160)

                    // send sms reminder
                    client.sms.messages.create({
                      to: alert.number,
                      from: config.sender.phone,
                      body: alertMessage
                    }, function(error, message) {

                        if (!error) {
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
                  }
                }
              })
            }
          })
        });
      } else {
        res.json({
          alerts: []
        });
      }
    });
  };

  var confirm = function (req, res) {
    db.events.update({
      _id: req.params.eventId
    }, {
      $set: {
        status: req.params.status
      }
    }, function () {
      res.render('thank-you-confirm');
    });
  };

  return {
    create: create,
    list: list,
    remove: remove,
    update: update,
    remind: remind,
    confirm: confirm
  };
};