/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var passport = require('passport');

  var twilio = require('twilio');
  var client = new twilio.RestClient('AC843270d590f2988caf4993adb06e0294', 'bada3f2f91251f3c0f6edefe94022366');

  // client.sms.messages.create({
  //     to:'+40746213760',
  //     from:'+13475146545',
  //     body:'ahoy hoy! Testing Twilio and node.js'
  // }, function(error, message) {
  //     // The HTTP request to Twilio will run asynchronously. This callback
  //     // function will be called when a response is received from Twilio
  //     // The "error" variable will contain error information, if any.
  //     // If the request was successful, this value will be "falsy"
  //     if (!error) {
  //         // The second argument to the callback will contain the information
  //         // sent back by Twilio for the request. In this case, it is the
  //         // information about the text messsage you just sent:
  //         console.log('Success! The SID for this SMS message is:');
  //         console.log(message.sid);
   
  //         console.log('Message sent on:');
  //         console.log(message.dateCreated);
  //     } else {
  //         console.log(error);
  //         console.log('Oops! There was an error.');
  //     }
  // });

  // client.makeCall({
  //   to:'+40746213760',
  //   from:'+13475146545',
  //   url:'http://demo.twilio.com/welcome/voice/'
  // }, function(err, call) {
  //     console.log('This call\'s unique ID is: ' + call.sid);
  //     console.log('This call was created at: ' + call.dateCreated);
  // });

  var view = function(req, res, next) {

    db.calendars.findOne({'userId': req.user._id}, function (err, calendar) {

      if (!calendar) {
        res.send({error: 'error'}, 400);
      }
      
      if (calendar) {
        
        request
        .get(config.ipAddress + ':' + config.port + '/api/1/alerts/' + calendar._id)
        .end(function(err, response){

          res.render('dashboard', {
            alerts: response.body,
            user: req.user,
            calendar: calendar
          });

        });

      }

    });

    

  };

  return {
    view: view
  };

};
