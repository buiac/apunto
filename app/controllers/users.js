/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

  var list = function (req, res) {
    
    db.contacts.find({calendarId: req.params.calendarId}, function (err, docs) {
      if (err) {
        res.send({error: err}, 400);
      }

      res.json({
        contacts: docs,
      });

    });

  };

  return {
    list: list
  };

};
