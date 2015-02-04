$(document).ready(function () {
  var calendar = null;
  var eventEditTemplate = null;

  var config = {
    calendarId: $('.calendar').data('calendarid')
  };

  var alerts = [];

  if(
    document.domain.indexOf('localhost') !== -1 ||
    document.domain.indexOf('localtunnel') !== -1 ||
    document.domain.indexOf('10.0.2.2') !== -1
  ) {

  config.env = 'local';
  config.message = 'ahoy hoy! Testing Twilio and node.js';
    //config.url.apiDev = 'https://api.livetest.savvyads.com';

  }

  // ejs.render(, data)

  // Get modal template
  $.ajax({
    method: 'GET',
    url: 'templates/event-edit.ejs'
  }).done(function (res) {

    eventEditTemplate = res;

  });

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

  // Create/update
  $('body').on('click', '.create', function (e) {

    e.preventDefault();

    var type = 'POST';
    var eventObj = $('.create-update').serializeObject();
    var url = '/api/1/' + config.calendarId + '/alerts/';

    eventObj.message = config.message;

    if (eventObj.id){
      type = 'PUT';
      url = url + eventObj.id;
      eventObj._id = eventObj.id;
    }

    $.ajax({
      type: type,
      url: url,
      data: eventObj
    }).done(function (res) {
      
      if (res.alert) {
        calendar.fullCalendar( 'renderEvent', res.alert );
      }

      // close modal
      $('#create-modal').modal('hide');

    });

  });

  // Delete

  var deleteEvent = function (event) {
    
    $.ajax({
      type: 'DELETE',
      url: '/api/1/' + config.calendarId+'/alert/' + event._id
    }).done(function (res) {
      
      calendar.fullCalendar('removeEvents', event._id);

    });

  };

  var showCreateModal = function (start, end, jsEvent, view) {
    
    var data = {
      modal: {
        title: 'Add Event',
        ctaLabel: 'Create Event'
      },
      event: {
        start: start.toDate(),
        end: end.toDate(),
        name: '',
        title: '',
        number: '',
        id: ''
      }
    };

    var temp = ejs.render(eventEditTemplate, data);

    $('#create-modal').find('.modal-content').html('');
    $('#create-modal').find('.modal-content').append(temp)
    $('#create-modal').modal();
  };

  var eventClick = function (event, jsEvent, view) {
    var data = {};

    if ($(jsEvent.target).hasClass('delete-event')) {

      jsEvent.preventDefault();
      
      deleteEvent(event);

    } else {

      data.modal = {
        title: 'Update Event',
        ctaLabel: 'Update Event'
      };

      data.event = event;
      data.event.id = event._id;

      var temp = ejs.render(eventEditTemplate, data);

      $('#create-modal').find('.modal-content').html('');
      $('#create-modal').find('.modal-content').append(temp);
      $('#create-modal').modal();
    }

    
  };

  var eventDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
    console.log(event.start.toDate(), event.end.toDate());
  };

  var createCalendar = function () {
    calendar = $('.calendar').fullCalendar({
      defaultView: 'agendaWeek',
      slotDuration: '00:15:00',
      firstDay: 1,
      selectable: true,
      scrollTime: '09:00',
      businessHours: {
        start: '09:00', // a start time (10am in this example)
        end: '17:00', // an end time (6pm in this example)

        dow: [ 1, 2, 3, 4, 5 ]
        // days of week. an array of zero-based day of week integers (0=Sunday)
        // (Monday-Thursday in this example)
      },
      editable: true,
      eventMouseOver: function() {
        console.log('mouseover');
      },
      eventRender: function (event, element, view) {

        //console.log(event);

        var deleteBtn = $('<a href="" class="delete-event fa fa-trash" data-id="' + event._id + '"></a>');

        $(element).append(deleteBtn);
      },
      select: showCreateModal,
      eventClick: eventClick,
      events: '/api/1/alerts/' + config.calendarId,
      eventDrop: eventDrop
    });

  };

  createCalendar();

});