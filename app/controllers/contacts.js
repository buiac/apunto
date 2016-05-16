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

      docs.sort(function (a, b) {
        
        if(a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }

        if(a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }

        return 0;
      })

      res.json({
        contacts: docs,
      });

    });

  };

  var deleteContact = function (req, res, next) {
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
    var contactId = req.body.contactId;

    var contact = {
      name: req.body.name,
      title: req.body.title,
      number: req.body.number,
    }

    if (contactId) {
      db.contacts.update({
        _id: contactId
      },{
        $set: contact
      }, function (err, newContact) {
        if (!err) {
          res.json({
            contact: newContact
          });
        }
      })      
    } else {
      // create new contact

      db.contacts.insert(req.body, function (err, newContact) {
        if (!err) {
          res.json({
            contact: newContact
          });
        }
      })
    }
  }

  return {
    // view: view,
    list: list,
    deleteContact: deleteContact,
    updateContact: updateContact
  };

};
