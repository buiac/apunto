/* alerts
 */

module.exports = function(config, db) {
  'use strict';

  var util = require('util');
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

    var name = req.body.name.trim();
    var userName = req.body.userName.trim();
    var companyName = req.body.companyName.trim();

    var message = req.body.message.trim();

    var number = req.body.number.replace(/[-() ]/gi, '');
    var startDate = new Date(req.body.start);
    var endDate = new Date(req.body.end);
    var reminderDate = new Date(req.body.reminderDate);
    var email = req.body.email;

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
      email: email
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
      reminderDate: reminderDate
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

          // send sms reminder
          client.sms.messages.create({
            to: alert.number,
            from: config.sender.phone,
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