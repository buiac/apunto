$(document).ready(function () {

  var year = new Date().getFullYear();
    var month = new Date().getMonth();
    var day = new Date().getDate();

  var showModal = function (calEvent, calElement, freeBusyManager, calendar, DomEvent) {
    
    console.log({
      calEvent: calEvent,
      calElement: calElement,
      freeBusyManager: freeBusyManager,
      calendar: calendar,
      DomEvent: DomEvent
    });
  };

  //app.get('/api/1/alerts/:calendarId', alerts.list);
  var events = [];

  $.get( "/api/1/alerts/0wyFBAWA3JtaAUOc", function( data ) {
      
    $.each(data, function (i, event) {
      var o = {};
      var date = new Date(event.date);

      o.id = event._id;
      o.start = date;
      o.end = new Date(date.getTime() + 1000 * 60 * 30);
      o.title = 'Bright event';
      
      events.push(o);
    });

    renderCalendar();
    //$.extend(events, data);  
  });

  var renderCalendar = function () {
    
    $('#calendar').weekCalendar({
      timeslotsPerHour: 4,
      //timeslotHeigh: 20,
      hourLine: true,
      data: {
        events: events
      },
      height: function () {
        return 500;
      },
      //businessHours: {start: 8, end: 21, limitDisplay: true},
      firstDayOfWeek: 1,
      daysToShow: 5,
      use24Hour: true,
      allowCalEventOverlap: true,
      eventNew: function (calEvent, calElement, freeBusyManager, calendar, DomEvent) {
        // create new event
      },
      eventDrop: function () {
        console.log('event moved');

        // update alert
      },
      eventClick: function (calEvent, calElement, freeBusyManager, calendar, DomEvent) {
        
        // show update form



        $.get( "/api/1/alert/" + calEvent.id, function( data ) {
          console.log(data);
        });
        
      }
    });
  };

  
});