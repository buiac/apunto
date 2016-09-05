/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

    var twilio = require('twilio');
    // Setup twilio
    var client = new twilio.RestClient(config.twilio.key, config.twilio.secret);

  var view = function (req, res) {

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

  var templatesView = function (req, res) {

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
        });
      }
    });
  };

  var templates = function (req, res) {
    var userId = req.params.userId;

    db.templates.find({
      userId: userId 
    }, function (err, templates) {
      
      res.json({
        templates: templates
      });
    });
  };

  var addTemplate = function (req, res) {
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
      }, function () {
        res.redirect('/settings/templates');
      });

    } else {
      // create a new template
      db.templates.insert({
        name: name,
        message: message,
        userId: userId
      }, function () {
        res.redirect('/settings/templates');
      });
    }
  };

  var deleteTemplate = function (req, res) {
    var id = req.params.id;

    db.templates.remove({
      _id: id
    }, function () {
      res.redirect('/settings/templates');
    });
  };

  var getUser = function (req, res) {
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

  var update = function (req, res) {
    req.checkBody('name', 'Name should not be empty').notEmpty();
    req.checkBody('userName', 'User name should not be empty').notEmpty();
    req.checkBody('template', 'Template should not be empty').notEmpty();

    var name = req.body.name.trim();
    var companyName = req.body.companyName.trim();    
    var userName = req.body.userName.trim();
    var userId = req.body._id;
    var template;

    if (req.body.template) {
      template = req.body.template.trim();
    }

    db.users.update({
      _id: userId
    }, {
      $set: {
        name: name,
        companyName: companyName,
        username: userName,
        template: template
      }
    }, {}, function(err) {

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

  var billingView = function (req, res) {
    res.render('settings/billing', {
      user: req.user, 
      success: false
    });
  }

  var order = function (req, res) {
    client.sms.messages.create({
      to: '+40755052956',
      from: config.sender.phone,
      body: 'A new order from ' + req.user.name
    }, function(error, message) {
        
        if (!error) {
          res.render('settings/billing', {
            user: req.user,
            success: true
          })      
        } else {
          res.json({
            error: true,
            errorObj: error
          });
        }
    });
    
  }

  return {
    view: view,
    update: update,
    getUser: getUser,
    templatesView: templatesView,
    addTemplate: addTemplate,
    deleteTemplate: deleteTemplate,
    templates: templates,
    billingView: billingView,
    order: order
  };

};
