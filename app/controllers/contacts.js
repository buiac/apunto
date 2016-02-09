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

  var view = function(req, res, next) {

    db.users.findOne({'_id': req.user._id}, function (err, user) {

      if (!user) {
        res.send({error: err}, 400);
      }
      
      if (user) {
        
        res.render('settings', {
          user: user,
        });

      }

    });
  };


  var list = function (req, res, next) {
    
    db.contacts.find({calendarId: req.params.calendarId}, function (err, docs) {
      if (err) {
        res.send({error: err}, 400);
      }

      res.json({
        contacts: docs,
      });

    });

  };

  var deleteContact = function (req, res, next) {

    console.log('\n\n\n\n')
    console.log('--------')
    console.log(req.params.contactId)
    console.log('--------')
    console.log('\n\n\n\n')
    
    db.contacts.remove({
      _id: req.params.contactId
    }, function (err, num) {
      
      if (!err) {
        res.json({
          message: 'done'
        });
      }

    })
  }

  var updateContact = function (req, res, next) {
    var contactId = req.params.contactId;

    console.log('\n\n\n\n')
    console.log('--------')
    console.log(req.body)
    console.log('--------')
    console.log('\n\n\n\n')

    if (contactId) {
      // update existing contact
    } else {
      // create new contact

      db.contacts.insert(req.body, function (err, newContact) {
        if (!err) {
          res.json({
            contact: newContact
          });
        }
      })

      // {
      //   name: '',
      //   title: '',
      //   number: '',
      //   calendarId: ''
      // }

    }

  }

  return {
    // view: view,
    list: list,
    deleteContact: deleteContact,
    updateContact: updateContact
  };

};
