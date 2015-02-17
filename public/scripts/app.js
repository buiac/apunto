// Helper methods
$.fn.serializeObject = function() {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
      if (o[this.name] !== undefined) {
          if (!o[this.name].push) {
              o[this.name] = [o[this.name]];
          }
          o[this.name].push(this.value || '');
      } else {
          o[this.name] = this.value || '';
      }
  });
  return o;
};

$(document).ready(function () {
  var calendar = null;
  var eventEditTemplate = null;
  var config = {
    calendarId: $('.calendar').data('calendarid'),
    userId: $('.contacts-list').data('userid'),
    userName: $('.calendar').data('username'),
    companyName: $('.calendar').data('companyname'),
    userId: $('.contacts-list').data('userid'),
    apiUrl: '',
    message: 'ahoy hoy! Testing Twilio and node.js'
  };

  if(
    document.domain.indexOf('localhost') !== -1 ||
    document.domain.indexOf('localtunnel') !== -1 ||
    document.domain.indexOf('10.0.2.2') !== -1
  ) {

    config.env = 'local';

  }

  // Get templates
  $.ajax({
    method: 'GET',
    url: 'templates/event-edit.ejs'
  }).done(function (res) {

    eventEditTemplate = res;

  });

  var showCreateModal = function (start, end, jsEvent, view) {
    var modal = $('#create-modal');
    var modalContent = modal.find('.modal-content');

    var data = {
      modal: {
        title: 'Schedule an event',
        idName: 'create',
        start: start.format('HH:mm'),
        end: end.format('HH:mm')
      },
      event: {
        start: start.toDate(),
        end: end.toDate(),
        name: '',
        title: '',
        number: '',
        _id: ''
      }
    };

    var temp = ejs.render(eventEditTemplate, data);

    modalContent.html('');
    modalContent.append(temp);
    modal.modal();
    
    $(".mobile-number").intlTelInput({
      defaultCountry: 'auto',
      utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
    });
  };

  var showUpdateModal = function (event) {
    var data = {};
    var modal = $('#create-modal');
    var modalContent = modal.find('.modal-content');

    data.modal = {
      idName: 'update',
      title: 'Update event'
    };

    data.event = event;

    var temp = ejs.render(eventEditTemplate, data);

    modalContent.html('');
    modalContent.append(temp);
    modal.modal();

    $(".mobile-number").intlTelInput({
      defaultCountry: 'auto',
      utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
    });

  };

  // Modal Create Event
  $('body').on('click', '.create', function (e) {
    
    e.preventDefault();

    var event = $('.create-update').serializeObject();
    event.userName = config.userName;
    event.companyName = config.companyName;
    event.number = $(".mobile-number").intlTelInput('getNumber');


    $.ajax({
      type: 'POST',
      url: '/api/1/' + config.calendarId + '/events/',
      data: event
    }).done(function (res) {
      
      calendar.fullCalendar( 'refetchEvents');

      // close modal
      $('#create-modal').modal('hide');

    });

  });

  // Modal Update Event
  $('body').on('click', '.update', function (e) {
    
    e.preventDefault();

    var event = $('.create-update').serializeObject();
    event.number = $(".mobile-number").intlTelInput('getNumber');

    $.ajax({
      type: 'PUT',
      url: '/api/1/' + config.calendarId + '/events/',
      data: event
    }).done(function (res) {
      
      calendar.fullCalendar( 'refetchEvents');

      // close modal
      $('#create-modal').modal('hide');

    }).fail(function (err) {
      console.log(err);
    });

  });

  // Delete Event
  var deleteEvent = function (event) {
    
    $.ajax({
      type: 'DELETE',
      url: '/api/1/' + config.calendarId+'/events/' + event._id
    }).done(function (res) {
      
      calendar.fullCalendar('removeEvents', event._id);

    });

  };

  // When user clicks on an existing event in calendar
  var eventClick = function (event, jsEvent, view) {


    // figure out if this is a DELETE or an UPDATE event
    if ($(jsEvent.target).hasClass('delete-event')) {

      jsEvent.preventDefault();
      
      deleteEvent(event);

    } else {

      showUpdateModal(event);

    }
  };

  // Resize and move around
  var eventUpdate = function (event, delta, revertFunc, jsEvent, ui, view) {
    console.log(event);
    $.ajax({
      type: 'PUT',
      url: '/api/1/' + config.calendarId + '/events/',
      data: {
        start: event.start.toDate(),
        end: event.end.toDate(),
        name: event.title,
        number: event.number,
        message: event.message,
        _id: event._id
      }
    }).done(function (res) {

    });

  };

  // Before rendering the event on the calendar
  var eventRender = function (event, element, view) {

    var deleteBtn = $('<a href="" class="delete-event fa fa-trash" data-id="' + event._id + '"></a>');
    $(element).append(deleteBtn);

  };

  var createCalendar = function () {
    calendar = $('.calendar').fullCalendar({
      
      // get events from
      events: '/api/1/events/' + config.calendarId,
      
      // layout and general settings
      defaultView: 'agendaWeek',
      allDaySlot: false,
      editable: true,
      slotDuration: '00:15:00',
      firstDay: 1,
      selectable: true,
      scrollTime: '09:00',
      timezone: 'local',
      height: 650,
      contentHeight: 650,
      businessHours: {
        start: '09:00', 
        end: '17:00',
        dow: [ 1, 2, 3, 4, 5 ]
      },
      header: {
        left: '',
        center: 'title',
        right:  'today prev,next'
      },
      
      // methods
      eventRender: eventRender,
      select: showCreateModal,
      eventClick: eventClick,
      eventDrop: eventUpdate,
      eventResize: eventUpdate,
      
      droppable: true,

      drop: function(date, jsEvent, ui) {
        
      },
      eventReceive: function (event) {

        $.ajax({
          type: 'POST',
          url: '/api/1/' + config.calendarId + '/events/',
          data: {
            userName: config.userName,
            companyName: config.companyName,
            start: event.start.toDate(),
            end: event.end.toDate(),
            name: event.title,
            number: event.number
          }
        }).done(function (res) {
          
          calendar.fullCalendar( 'refetchEvents');

          // // close modal
          // $('#create-modal').modal('hide');

        });

      },
    });

  };



  createCalendar();

});