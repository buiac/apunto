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

  var view = function (req, res, next) {

    db.users.findOne({'_id': req.user._id}, function (err, user) {

      if (!user) {
        res.send({error: err}, 400);
      }
      
      if (user) {
        
        res.render('settings/account', {
          user: user,
        });

      }

    });
  };

  var templatesView = function (req, res, next) {
    console.log('\n\n\n\n')
    console.log('--------')
    console.log(req.user)
    console.log('--------')
    console.log('\n\n\n\n')

    db.users.findOne({'_id': req.user._id}, function (err, user) {

      if (!user) {
        res.send({error: err}, 400);
      }
      
      if (user) {
        
        db.templates.find({
          userId: req.user._id
        }, function (err, templates) {
          
          if (err) {
            res.send({error: err}, 400);
          }

          res.render('settings/templates', {
            user: user,
            templates: templates
          });

        })

      }

    });
  };

  var templatesJson = function (req, res, next) {
    var userId = req.params.userId;

    db.templates.find({
      userId: userId 
    }, function (err, templates) {
      
      res.json({
        templates: templates
      })
    })
  }

  var addTemplate = function (req, res, next) {
    var name = req.body.name;
    var message = req.body.message;
    var userId = req.body.userId;
    var templateId = req.body.templateId;


    if (templateId) {

      // perform an update
      db.templates.update({
        _id: templateId
      },{
        $set: {
          name: name,
          message: message
        }
      }, function (err, num) {
        
        res.redirect('/settings/templates')
      })

    } else {
      // create a new template
      db.templates.insert({
        name: name,
        message: message,
        userId: userId
      }, function (err, newDoc) {
        
        res.redirect('/settings/templates')
      })
    }
  };

  var deleteTemplate = function (req, res, next) {
    var id = req.params.id

    db.templates.remove({
      _id: id
    }, function (err, num) {
      res.redirect('/settings/templates')
    })
  }

  var getUser = function (req, res, next) {

    db.users.findOne({'_id': req.params.userId}, function (err, user) {

      if (!user) {
        res.send({error: err}, 400);
      }
      
      if (user) {
        
        res.json({
          user: {
            username: user.username,
            _id: user._id,
            name: user.name || '',
            companyName: user.companyName || ''
          }
        });

      }

    });

  };

  var update = function (req, res, next) {
    req.checkBody('name', 'Name should not be empty').notEmpty();
    req.checkBody('userName', 'User name should not be empty').notEmpty();
    req.checkBody('template', 'Template should not be empty').notEmpty();

    var name = req.body.name.trim();
    var companyName = req.body.companyName.trim();
    var template = req.body.template.trim();
    var userName = req.body.userName.trim();
    var userId = req.body._id;

    db.users.update({
      _id: userId
    }, {
      $set: {
        name: name,
        companyName: companyName,
        username: userName,
        template: template
      }
    }, {}, function(err, num, user) {

      if (err) {
        res.send({error: err}, 400);
      }

      db.users.findOne({_id: userId}, function (err, user) {
        if (err) {
          res.send({error: err}, 400);
        }

        res.render('settings/account', {
          user: user,
        });

      });
      
    });
  };

  var updateOnboarding = function (req, res, next) {
    req.checkBody('name', 'Name should not be empty').notEmpty();
    req.checkBody('companyName', 'Company name should not be empty').notEmpty();

    var name = req.body.name.trim();
    var companyName = req.body.companyName.trim();
    var userId = req.body._id;


    db.users.update({
      _id: userId
    }, {
      $set: {
        name: name,
        companyName: companyName
      }
    }, {}, function(err, num, user) {



      if (err) {
        res.send({error: err}, 400);
      }

      if (num > 0) {
        db.users.findOne({_id: userId}, function (err, doc) {
          if (err) {
            res.send({error: err}, 400);
          }

          res.json({
            user: {
              username: doc.username,
              _id: doc._id,
              name: doc.name || '',
              companyName: doc.companyName || ''
            }
          });
        });
      }

    });

  };

  return {
    view: view,
    update: update,
    getUser: getUser,
    updateOnboarding: updateOnboarding,
    templatesView: templatesView,
    addTemplate: addTemplate,
    deleteTemplate: deleteTemplate,
    templatesJson: templatesJson
  };

};
