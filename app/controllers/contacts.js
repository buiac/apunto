module.exports = function(config, db) {
  'use strict';

  var list = function (req, res) {
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
      });

      res.json({
        contacts: docs,
      });

    });

  };

  var deleteContact = function (req, res) {
    db.contacts.remove({
      _id: req.params.contactId
    }, function (err) {
      if (!err) {
        res.json({
          message: 'done'
        });
      }
    });
  };

  var updateContact = function (req, res) {
    var contactId = req.body.contactId;

    var contact = {
      name: req.body.name,
      title: req.body.title,
      number: req.body.number,
      email: req.body.email
    };

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
      });
    } else {
      // create new contact
      db.contacts.insert(req.body, function (err, newContact) {
        if (!err) {
          res.json({
            contact: newContact
          });
        }
      });
    }
  };

  return {
    list: list,
    deleteContact: deleteContact,
    updateContact: updateContact
  };
};