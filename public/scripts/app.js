// Helper methods

var Apunto = {};

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
  var templates = null;


  var getWordsBetweenCurlies = function (str) {
    var results = []
    var re = /{([^}]+)}/g
    var text
    while (text = re.exec(str)) {
      results.push(text[1])
    }
    return results
  };

  Apunto.config = {
    calendarId: $('.calendar').data('calendarid'),
    userId: $('.contacts-list').data('userid'),
    userName: $('.calendar').data('username'),
    template: $('.calendar').data('template'),
    companyName: $('.calendar').data('companyname'),
    apiUrl: '',
    tzoffset: new Date().getTimezoneOffset(),
    message: 'ahoy hoy! Testing Twilio and node.js'
  };

  var obj = {
    full_name: Apunto.config.userName,
    company_name: Apunto.config.companyName
  };

  if(
    document.domain.indexOf('localhost') !== -1 ||
    document.domain.indexOf('localtunnel') !== -1 ||
    document.domain.indexOf('10.0.2.2') !== -1
  ) {

    Apunto.config.env = 'local';

  }

  // Get templates
  $.ajax({
    method: 'GET',
    url: '/templates/event-edit.ejs'
  }).done(function (res) {

    eventEditTemplate = res;

  });

  var showCreateModal = function (start, end, jsEvent, view) {

    var modal = $('#create-modal');
    var modalContent = modal.find('.modal-content');


    // select templates
    $.ajax({
      method: 'get',
      url: '/t/templatesJson/' + Apunto.config.userId
    }).done(function (res) {
      
      templates = res.templates;

      if (!templates.length) {
        templates = [{
          userId: Apunto.config.userId,
          name: 'Default template',
          message: 'Reminder: you have an appointment on {date} starting at {time} with {full_name} from {company_name}.'
        }]
      }

      var message = templates[0].message;

      var replaceArray = getWordsBetweenCurlies(message);

      obj.time = start.format('HH:mm');
      obj.date = start.format('DD/MM/YYYY');

      replaceArray.forEach(function (item) {
        // replace the parameter e.g.:{year} with the value of #year select
        message = message.replace(new RegExp('{' + item + '}', 'gi'), obj[item]);
      });

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
          message: message,
          templates: templates,
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

    })
    


  };

  var changeTemplate = function (e) {
    var template = templates[this.value]
    
    var replaceArray = getWordsBetweenCurlies(template.message);

    replaceArray.forEach(function (item) {
      // replace the parameter e.g.:{year} with the value of #year select
      template.message = template.message.replace(new RegExp('{' + item + '}', 'gi'), obj[item]);
    });

    $(this).parents('.modal-body').find('[name=message]').html(template.message)

  }

  var showUpdateModal = function (event) {
    var data = {};
    var modal = $('#create-modal');
    var modalContent = modal.find('.modal-content');

    obj.time = event.start.format('HH:mm');

    $.ajax({
      method: 'get',
      url: '/t/templatesJson/' + Apunto.config.userId
    }).done(function (res) {

      templates = res.templates;

      if (!templates.length) {
        templates = [{
          userId: Apunto.config.userId,
          name: 'Default template',
          message: 'Reminder: you have an appointment starting at {time} with {full_name} from {company_name}.'
        }]
      }

      data.modal = {
        idName: 'update',
        title: 'Update event',
        start: event.start.format('HH:mm'),
        end: event.end.format('HH:mm')
      };

      data.event = event;
      data.event.templates = templates

      var temp = ejs.render(eventEditTemplate, data);

      modalContent.html('');
      modalContent.append(temp);
      modal.modal();

      $(".mobile-number").intlTelInput({
        defaultCountry: 'auto',
        utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
      });
    });

    

  };

  // Modal Create Event
  $('body').on('click', '.create', function (e) {
    
    e.preventDefault();

    var event = $('.create-update').serializeObject();
    event.userName = Apunto.config.userName;
    event.companyName = Apunto.config.companyName;
    event.number = $(".mobile-number").intlTelInput('getNumber');
    event.tzoffset = Apunto.config.tzoffset;

    var interval = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;

    if (interval < 60) {
      event.end = moment(event.start).add(1, 'hour').toDate();
    }

    $.ajax({
      type: 'POST',
      url: '/api/1/' + Apunto.config.calendarId + '/events/',
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
    event.tzoffset = Apunto.config.tzoffset;

    $.ajax({
      type: 'PUT',
      url: '/api/1/' + Apunto.config.calendarId + '/events/',
      data: event
    }).done(function (res) {
      
      calendar.fullCalendar( 'refetchEvents');

      // close modal
      $('#create-modal').modal('hide');

    }).fail(function (err) {
      console.log(err);
    });

  });

  var enableTextarea = function (e) {
    $(this).parent().find('textarea').removeAttr('readonly').focus();
    $(this).hide();
  };

  var disableTextarea = function (e) {
    
    $(this).attr('readonly', 'true');
    $('.textarea-cover').show();

  };

  $('body').on('click', '.textarea-cover', enableTextarea);
  $('body').on('blur' , '.modal-message-preview textarea', disableTextarea);

  $('body').on('keyup', '.modal-message-preview textarea', function () {
    var max = 160;
    var len = $(this).val().length;
    if (len >= max) {
      $('#charNum').text(' you have reached the limit');
    } else {
      var charc = max - len;
      $('#charNum').text(charc + ' characters left');
    }
  });

  // Delete Event
  var deleteEvent = function (event) {
    
    $.ajax({
      type: 'DELETE',
      url: '/api/1/' + Apunto.config.calendarId+'/events/' + event._id
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
    
    $.ajax({
      type: 'PUT',
      url: '/api/1/' + Apunto.config.calendarId + '/events/',
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

  var setTimeline = function() {
    setTimeout(function () {
      var curTime = new Date();
      if(curTime.getHours() == 0 && curTime.getMinutes() <= 5) // Because I am calling this function every 5 minutes
      {// the day has changed

          var todayElem = $(".fc-today");
          todayElem.removeClass("fc-today");
          todayElem.removeClass("fc-state-highlight");

          todayElem.next().addClass("fc-today");
          todayElem.next().addClass("fc-state-highlight");
      }

      var parentDiv = $(".fc-time-grid");
      var timeline = parentDiv.children(".timeline");
      if (timeline.length == 0) { //if timeline isn't there, add it
        timeline = $("<hr>").addClass("timeline");
        parentDiv.prepend(timeline);
      }

      var curCalView = $('.calendar').fullCalendar("getView");

      if (curCalView.start < curTime && curCalView.end > curTime) {
          timeline.show();

      } else {
          timeline.hide();
      }

      var curSeconds = (curTime.getHours() * 60 * 60) + (curTime.getMinutes() * 60) + curTime.getSeconds();
      var percentOfDay = curSeconds / 86400; //24 * 60 * 60 = 86400, # of seconds in a day
      var topLoc = Math.floor(parentDiv.height() * percentOfDay);

      timeline.css("top", topLoc + "px");

      if (curCalView.name == "agendaWeek") { //week view, don't want the timeline to go the whole way across
          var dayCol = $(".fc-today:visible");
          if(dayCol.position() != null)
          {
              var left = dayCol.position().left + 1;
              var width = dayCol.width();
              timeline.css({
                  left: left + "px",
                  width: width + "px"
              });
          }
      }

    }, 10);
  };

  var updateTemplateForm = function (e) {
    e.preventDefault();

    var $parent = $(this).parent();
    var $templateForm = $('.form-template');
    var $submitButton = $templateForm.find('[type=submit]');
    var $deleteButton = $templateForm.find('.template-remove')
    
    // data
    var name = $parent.data('name');
    var message = $parent.data('message');
    var id = $parent.data('id');

    // update elements values
    $templateForm.find('[name=name]').val(name)
    $templateForm.find('[name=message]').val(message)
    $templateForm.find('[name=templateId]').val(id)

    // show delete button
    $templateForm.addClass('form-template--update')

    // update html
    $deleteButton.attr('href', '/settings/templates/' + id)
    $submitButton.html('Update template')
    $submitButton.before($deleteButton)
  };

  var showTemplateForm = function (e) {
    e.preventDefault()

    $('.form-template').addClass('form-template--new')
  }

  $('body').on('change', '.modal-template-select', changeTemplate)
  $('body').on('click', '.template-list a', updateTemplateForm)
  $('body').on('click', '.template-add-new', showTemplateForm)
  

  var createCalendar = function () {
    
    calendar = $('.calendar').fullCalendar({
      
      // get events from
      events: '/api/1/events/' + Apunto.config.calendarId,
      
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
      defaultEventMinutes: 60,
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

      viewRender: function (view) {
        
        timelineInterval = window.setInterval(setTimeline, 1000 * 60);

        try {
          setTimeline();
        } catch(err) { console.log('error: ' + err); }
      },
      eventReceive: function (event) {

        var message = Apunto.config.template;
        var obj = {
          time: event.start.format('HH:mm'),
          full_name: Apunto.config.userName,
          company_name: Apunto.config.companyName
        };

        var replaceArray = getWordsBetweenCurlies(message);

        replaceArray.forEach(function (item) {
          // replace the parameter e.g.:{year} with the value of #year select
          message = message.replace(new RegExp('{' + item + '}', 'gi'), obj[item]);
        });

        $.ajax({
          type: 'POST',
          url: '/api/1/' + Apunto.config.calendarId + '/events/',
          data: {
            userName: Apunto.config.userName,
            companyName: Apunto.config.companyName,
            start: event.start.toDate(),
            end: event.end.toDate(),
            name: event.title,
            number: event.number,
            message: message
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