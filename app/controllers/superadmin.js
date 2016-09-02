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

    db.events.find({
      calendarId: params.calendarId,
      start: {
        $gte: params.startDate,
        $lte: params.endDate
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
      var arr = []

      users.forEach(function (user) {
        user.events = []
        arr.push(getCalendar({userId: user._id}))
      })

      q.all(arr).then(function (calendars) {
        
        for (var i = 0; i < calendars.length; i++) {
          for (var n = 0; n < users.length; n++) {
            if (calendars[i]) {
              if (calendars[i].userId === users[n]._id) {
                users[n].calendar = calendars[i]
              }
            }
          }
        }

        var array = []
        
        for (var m = 0; m < users.length; m++) {
          if (users[m].calendar) {
            
            var startDate = new Date(moment(req.query.startDate).format())
            var endDate = new Date(moment(req.query.endDate).format())

            // console.log('----startDate------')
            // console.log(startDate)
            // console.log(endDate)
            // console.log('----------')
            array.push(getEvents({
              calendarId: users[m].calendar._id,
              startDate: startDate,
              endDate: endDate
            }))
          }
        }

        q.all(array).then(function (events) {
          // merge the resulted array of arrays
          events = [].concat.apply([], events);

          for (var j = 0; j < events.length; j++) {
            for (var k = 0; k < users.length; k++) {
              if (users[k].calendar) {
                if (users[k].calendar._id === events[j].calendarId) {
                  users[k].events.push(events[j])
                }
              }
            }
          }

          res.render('superadmin/dashboard.ejs', {
            users: users
          });      

        })
      })
    })

    
  }

  
  // var dashboard = function (req, res) {

  //   getAllUsers({}).then(function (users) {
      
  //     var arr = [];
      
  //     users.forEach(function (user) {
  //       arr.push(getCalendar({
  //         userId: user._id
  //       }));
  //     });

  //     q.all(arr).then(function (calendars) {

  //       // create a hash
  //       var usersHash = {};
  //       users.forEach(function (user) {
  //         usersHash[user._id] = user;
  //       });

  //       calendars.forEach(function (calendar) {
  //         if (calendar && calendar.userId in usersHash) {
  //           usersHash[calendar.userId].calendar = calendar;
  //         }
  //       });    


  //       var array = [];

  //       calendars.forEach(function (calendar) {
  //         if (calendar) {
  //           array.push(getEvents({
  //             calendarId: calendar._id
  //           }));
  //         }
          
  //       });

  //       q.all(array).then(function (events) {

  //         events = [].concat.apply([], events);

  //         var calendarHash = {};

  //         users.forEach(function (user) {
  //           calendarHash[user.calendar._id] = user;
  //         });

  //         events.forEach(function (event) {
  //           if (event.calendarId in calendarHash) {
  //             if (!calendarHash[event.calendarId].events) {
  //               calendarHash[event.calendarId].events = [];
  //             }

  //             calendarHash[event.calendarId].events.push(event);
  //           }
  //         });

  //         res.render('superadmin/dashboard.ejs', {
  //           users: users
  //         });
  //       });
  //     });
  //   });
  // };

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
