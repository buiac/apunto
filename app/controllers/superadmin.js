/* superadmin
 */

module.exports = function(config, db) {
  'use strict';

  var q = require('q');
  var moment = require('moment');

  var getAllUsers = function () {
    var deferred = q.defer();

    db.users.find({}, function (err, users) {

      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(users);

    });

    return deferred.promise;
  };

  var getCalendar = function (params) {
    var deferred = q.defer();

    db.calendars.findOne({
      userId: params.userId
    }, function (err, calendar) {

      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(calendar);
    });

    return deferred.promise;
  };


  var getEvents = function (params) {
    var deferred = q.defer();

    // get the events in the last 3 months
    var startDate = new Date(moment().subtract(1, 'months').startOf('month').format());
    var endDate = new Date(moment().subtract(1, 'months').endOf('month').format());

    db.events.find({
      calendarId: params.calendarId,
      start: {
        $gte: startDate,
        $lte: endDate
      }
    }, function (err, events) {

      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(events);
    });

    return deferred.promise;
  };

  var dashboard = function (req, res) {

    getAllUsers({}).then(function (users) {
      
      var arr = [];
      
      users.forEach(function (user) {
        arr.push(getCalendar({
          userId: user._id
        }));
      });

      q.all(arr).then(function (calendars) {

        // create a hash
        var usersHash = {};
        users.forEach(function (user) {
          usersHash[user._id] = user;
        });

        calendars.forEach(function (calendar) {
          if (calendar.userId in usersHash) {
            usersHash[calendar.userId].calendar = calendar;
          }
        });    

        var array = [];

        calendars.forEach(function (calendar) {
          array.push(getEvents({
            calendarId: calendar._id
          }));
        });

        q.all(array).then(function (events) {

          events = [].concat.apply([], events);

          var calendarHash = {};

          users.forEach(function (user) {
            calendarHash[user.calendar._id] = user;
          });

          events.forEach(function (event) {
            if (event.calendarId in calendarHash) {
              if (!calendarHash[event.calendarId].events) {
                calendarHash[event.calendarId].events = [];
              }

              calendarHash[event.calendarId].events.push(event);
            }
          });

          res.render('superadmin/dashboard.ejs', {
            users: users
          });
        });
      });
    });
  };

  var deleteUser = function (req, res) {
    // /sa/delete-user/:userId

    var userId = req.params.userId;
    db.calendars.findOne({
      userId: userId
    }, function (err, calendar) {
      
      db.events.remove({
        calendarId: calendar._id
      }, function () {
        
        db.calendars.remove({
          userId: userId
        }, function () {
          
          db.users.remove({
            _id: userId
          }, function  () {
            res.redirect('/sa/dashboard');
          });
        });
      });
    }); 
  };

  return {
    dashboard: dashboard,
    deleteUser: deleteUser
  };
};
