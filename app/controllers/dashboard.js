/* dashboard
 */

module.exports = function(config, db) {
  'use strict';

  var view = function(req, res) {
    db.calendars.findOne({'userId': req.user._id}, function (err, calendar) {

      if (!calendar) {
        res.send({error: 'error'}, 400);
      }
          
      res.render('dashboard', {
        user: req.user,
        calendar: calendar
      });
    });
  };

  return {
    view: view
  };

};
