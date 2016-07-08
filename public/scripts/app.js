(function ($, moment, ejs, i18n) {
  'use strict';

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
      var results = [];
      var re = /{([^}]+)}/g;
      var text;
      while (text = re.exec(str)) {
        results.push(text[1]);
      }
      return results;
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

    // get the message templates created by the user
    $.ajax({
      method: 'get',
      url: '/api/1/settings/templates/' + Apunto.config.userId
    }).done(function (res) {
      templates = res.templates;
    });

    var contacts = null;

    // get the contacts for this user
    if ($('.calendar').data('calendarid')) {
      $.ajax({
        method: 'GET',
        url: 'api/1/contacts/' + $('.calendar').data('calendarid'),
      }).done(function (res) {
        contacts = res.contacts;
      });
    }

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

    // Get the event edit template
    $.ajax({
      method: 'GET',
      url: '/templates/event-edit.ejs'
    }).done(function (res) {

      eventEditTemplate = res;

    });

    var showCreateModal = function (start, end) {

      var modal = $('#create-modal');
      var modalContent = modal.find('.modal-content');

      // select templates
      $.ajax({
        method: 'get',
        url: '/api/1/settings/templates/' + Apunto.config.userId
      }).done(function (res) {
        
        templates = res.templates;

        if (!templates.length) {
          templates = [{
            userId: Apunto.config.userId,
            name: 'Default template',
            message: 'Reminder: you have an appointment on {date} starting at {time} with {full_name} from {company_name}.'
          }];
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
            end: end.format('HH:mm'),
            contacts: contacts
          },
          event: {
            start: start.toDate(),
            end: end.toDate(),
            name: '',
            title: '',
            number: '',
            message: message,
            templates: templates,
            templateId: templates[0]._id,
            _id: ''
          }
        };

        var temp = ejs.render(eventEditTemplate, data);

        modalContent.html('');
        modalContent.append(temp);
        modal.modal();
        
        // init mobile number
        $('.mobile-number').intlTelInput({
          defaultCountry: 'auto',
          utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
        });

        // remove the tabindex from the modal
        $('#create-modal').removeAttr('tabindex');

        // init select2
        $('#select-contact').select2();
      });
    };

    $('body').on('change','.find-contact select', function () {
      // create a hash out of the contacts
      var contactsHash = {};
      contacts.forEach(function (contact) {
        contactsHash[contact._id] = contact;
      });
      var contactId = $(this).val();
      var contact = contactsHash[contactId];
      var $form = $(this).parents('form');
      
      // get the contacts template
      $.ajax({
        method: 'GET',
        url: '/templates/modal-contact-template.ejs'
      }).done(function (res) {
        
        var temp = ejs.render(res, {contact: contact});
        
        $form.find('.contact-details').empty().append(temp);
        $form.addClass('contact-details--show');
        
        // update inputs
        $form.find('.contact-new [name="name"]').val(contact.name);
        $form.find('.contact-new [name="number"]').val(contact.number);
        $form.find('.contact-new [name="email"]').val(contact.email);
      });
    });

    // select a different template for the message that will be sent
    var changeTemplate = function () {

      var id = this.value;

      var template = $.grep(templates, function(template){ return template._id === id; });
      template = template[0];

      var replaceArray = getWordsBetweenCurlies(template.message);
      var date = $(this).parents('.modal-body').find('[name="start"]').val();

      var obj = {
        time: moment(date).format('HH:mm'),
        date: moment(date).format('DD/MM/YYYY'),
        full_name: Apunto.config.userName,
        company_name: Apunto.config.companyName
      };

      replaceArray.forEach(function (item) {
        // replace the parameter e.g.:{year} with the value of #year select
        template.message = template.message.replace(new RegExp('{' + item + '}', 'gi'), obj[item]);
      });

      $(this).parents('.modal-body').find('[name=message]').html(template.message);
      $(this).parents('.modal-body').find('[name=templateId]').val(template._id);
    };

    var showUpdateModal = function (event) {
      var data = {};
      var modal = $('#create-modal');
      var modalContent = modal.find('.modal-content');

      obj.time = event.start.format('HH:mm');

      $.ajax({
        method: 'get',
        url: '/api/1/settings/templates/' + Apunto.config.userId
      }).done(function (res) {

        templates = res.templates;

        if (!templates.length) {
          templates = [{
            userId: Apunto.config.userId,
            name: 'Default template',
            message: 'Reminder: you have an appointment starting at {time} with {full_name} from {company_name}.'
          }];
        }

        // number of hours the reminder should be sent
        var reminderUnit = (new Date(event.start).getTime() - new Date(event.reminderDate).getTime()) / 3600000;

        data.modal = {
          idName: 'update',
          title: 'Update event',
          start: event.start.format('HH:mm'),
          end: event.end.format('HH:mm'),
          reminderUnit: reminderUnit,
          contacts: contacts
        };

        data.event = event;
        data.event.templates = templates;

        var temp = ejs.render(eventEditTemplate, data);

        modalContent.html('');
        modalContent.append(temp);
        modal.modal();

        $('.mobile-number').intlTelInput({
          defaultCountry: 'auto',
          utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
        });
      });
    };

    var createEvent = function (e) {
      e.preventDefault();

      var $form = $(this).parents('.create-update');
      var $alertDanger = $form.find('.alert-danger');
      var $reminderType = $form.find('[name=reminder-type]');
      var $reminderUnit = $form.find('[name=reminder-unit]');

      var event = $('.create-update').serializeObject();
      event.userName = Apunto.config.userName;
      event.companyName = Apunto.config.companyName;
      event.number = $('.mobile-number').intlTelInput('getNumber');
      event.tzoffset = Apunto.config.tzoffset;

      var interval = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;

      if (interval < 60) {
        event.end = moment(event.start).add(1, 'hour').toDate();
      }

      // clear the error container of messages and hide it
      $alertDanger.html('');
      $form.removeClass('errors');

      // set the reminder Date
      if ($reminderType.val() === 'days') {
        $reminderUnit.val(1);
      }

      var reminderDate = moment(event.start).subtract($reminderUnit.val(), $reminderType.val()).toDate();
      event.reminderDate = reminderDate;

      $.ajax({
        type: 'POST',
        url: '/api/1/events/' + Apunto.config.calendarId,
        data: event
      }).done(function () {
        
        calendar.fullCalendar( 'refetchEvents');

        // close modal
        $('#create-modal').modal('hide');

      }).fail(function (res) {
        
        // handle error messages
        var errors = JSON.parse(res.responseText);

        $.each(errors, function (i, error) {

          // update the error container with messages
          var msg = $('<p></p>').html(error.msg);
          $alertDanger.append(msg);

          // add a class to the form
          $form.addClass('errors');
        });
      });
    };

    // send data to server when user clicks on the update button in the modal
    var updateEvent = function (e) {
      e.preventDefault();

      var $form = $(this).parents('form');
      var $reminderType = $form.find('[name=reminder-type]');
      var $reminderUnit = $form.find('[name=reminder-unit]');

      var event = $('.create-update').serializeObject();
      event.number = $('.mobile-number').intlTelInput('getNumber');
      event.tzoffset = Apunto.config.tzoffset;
      event.companyName = Apunto.config.companyName;

      // set the reminder Date
      if ($reminderType.val() === 'days') {
        $reminderUnit.val(1);
      }

      var reminderDate = moment(event.start).subtract($reminderUnit.val(), $reminderType.val()).toDate();
      event.reminderDate = reminderDate;

      $.ajax({
        type: 'PUT',
        url: '/api/1/events/' + Apunto.config.calendarId,
        data: event
      }).done(function () {
        
        calendar.fullCalendar( 'refetchEvents');

        // close modal
        $('#create-modal').modal('hide');

      }).fail(function (err) {
        console.log(err);
      });
    };

    var enableTextarea = function () {
      $(this).parent().find('textarea').removeAttr('readonly').focus();
      $(this).hide();
    };

    var disableTextarea = function () {
      $(this).attr('readonly', 'true');
      $('.textarea-cover').show();
    };

    var previewMessage = function () {
      var max = 160;
      var len = $(this).val().length;
      if (len >= max) {
        $('#charNum').text(' you have reached the limit');
      } else {
        var charc = max - len;
        $('#charNum').text(charc + ' characters left');
      }
    };

    // Delete Event
    var deleteEvent = function (event) {
      $.ajax({
        type: 'DELETE',
        url: '/api/1/events/' + Apunto.config.calendarId+'/' + event._id
      }).done(function () {
        
        calendar.fullCalendar('removeEvents', event._id);

      });

    };

    // When user clicks on an existing event in calendar
    var eventClick = function (event, jsEvent) {

      // figure out if this is a DELETE or an UPDATE event
      if ($(jsEvent.target).hasClass('delete-event')) {

        jsEvent.preventDefault();
        
        deleteEvent(event);

      } else {

        showUpdateModal(event);

      }
    };

    // Resize and move around
    var eventUpdate = function (event, delta) {
      var id = event.templateId;

      // get the id of the template
      var template = $.grep(templates, function(template){ return template._id === id; });
      var message = template[0].message;

      var obj = {
        time: event.start.format('HH:mm'),
        date: event.start.format('DD/MM/YYYY'),
        full_name: Apunto.config.userName,
        company_name: Apunto.config.companyName
      };

      var replaceArray = getWordsBetweenCurlies(message);

      replaceArray.forEach(function (item) {
        // replace the parameter e.g.:{year} with the value of #year select
        message = message.replace(new RegExp('{' + item + '}', 'gi'), obj[item]);
      });

      var reminderDate = event.reminderDate;
      var deltaMinutes = Math.abs(delta._milliseconds) / 60000;

      
      if (delta._milliseconds !== 0) {
        if (delta._milliseconds < 0) {
          reminderDate = moment(reminderDate).subtract(deltaMinutes , 'minutes').toDate();
        } else {
          reminderDate = moment(reminderDate).add(deltaMinutes, 'minutes').toDate();
        }
      } 

      if (delta._days !== 0) {
        if (delta._days < 0) {
          reminderDate = moment(reminderDate).subtract(Math.abs(delta._days) , 'days').toDate();
        } else {
          reminderDate = moment(reminderDate).add(Math.abs(delta._days), 'days').toDate();
        }
      }
      
      $.ajax({
        type: 'PUT',
        url: '/api/1/events/' + Apunto.config.calendarId,
        data: {
          start: event.start.toDate(),
          end: event.end.toDate(),
          name: event.title,
          email: event.email,
          number: event.number,
          companyName: Apunto.config.companyName,
          message: message,
          templateId: template[0]._id,
          reminderDate: reminderDate,
          _id: event._id
        }
      }).done(function () {
        calendar.fullCalendar( 'refetchEvents');
      });

    };

    // Before rendering the event on the calendar
    var eventRender = function (event, element) {
      event.sent = event.sent || false;

      var deleteBtn = $('<a href="" class="delete-event fa fa-trash" data-id="' + event._id + '"></a>');
      var sent = $('<div class="event-sent event-sent--' + event.sent + '"><span class="event-sent-true">Reminder sent</span> <span class="event-sent-false">Reminder not sent yet</span></div>');
      var status = $('<div class="event-status event-status--' + event.status + '"><span class="event-status-false">Not confirmed yet</span> <span class="event-status-1">Confirmed</span> <span class="event-status-0">Canceled</span></div>');
      $(element).append(deleteBtn);
      $(element).append(sent);
      $(element).append(status);
    };

    var setTimeline = function() {
      setTimeout(function () {
        var curTime = new Date();
        if(curTime.getHours() === 0 && curTime.getMinutes() <= 5) // Because I am calling this function every 5 minutes
        {// the day has changed

            var todayElem = $('.fc-today');
            todayElem.removeClass('fc-today');
            todayElem.removeClass('fc-state-highlight');

            todayElem.next().addClass('fc-today');
            todayElem.next().addClass('fc-state-highlight');
        }

        var parentDiv = $('.fc-time-grid');
        var timeline = parentDiv.children('.timeline');
        if (timeline.length === 0) { //if timeline isn't there, add it
          timeline = $('<hr>').addClass('timeline');
          parentDiv.prepend(timeline);
        }

        var curCalView = $('.calendar').fullCalendar('getView');

        if (curCalView.start < curTime && curCalView.end > curTime) {
            timeline.show();

        } else {
            timeline.hide();
        }

        var curSeconds = (curTime.getHours() * 60 * 60) + (curTime.getMinutes() * 60) + curTime.getSeconds();
        var percentOfDay = curSeconds / 86400; //24 * 60 * 60 = 86400, # of seconds in a day
        var topLoc = Math.floor(parentDiv.height() * percentOfDay);

        timeline.css('top', topLoc + 'px');

        if (curCalView.name === 'agendaWeek') { //week view, don't want the timeline to go the whole way across
            var dayCol = $('.fc-today:visible');
            if(dayCol.position() !== null) {
                var left = dayCol.position().left + 1;
                var width = dayCol.width();
                timeline.css({
                    left: left + 'px',
                    width: width + 'px'
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
      var $deleteButton = $templateForm.find('.template-remove');
      
      // data
      var name = $parent.data('name');
      var message = $parent.data('message');
      var id = $parent.data('id');

      // update elements values
      $templateForm.find('[name=name]').val(name);
      $templateForm.find('[name=message]').val(message);
      $templateForm.find('[name=templateId]').val(id);

      // show delete button
      $templateForm.addClass('form-template--update');

      // update html
      $deleteButton.attr('href', '/settings/templates/' + id);
      $submitButton.html('Update template');
      $submitButton.before($deleteButton);
    };

    var showTemplateForm = function (e) {
      e.preventDefault();
      $('.form-template').addClass('form-template--new');
    };

    var viewRender = function () {
          
      window.setInterval(setTimeline, 1000 * 60);

      try {
        setTimeline();
      } catch(err) { console.log('error: ' + err); }

    };

    // Drag a contact from the right menu and drop into the calendar
    var eventReceive = function (event) {
      $.ajax({
        method: 'get',
        url: '/api/1/settings/templates/' + Apunto.config.userId
      }).done(function (res) {
        
        templates = res.templates;

        var message = templates[0].message;

        var obj = {
          time: event.start.format('HH:mm'),
          date: event.start.format('DD/MM/YYYY'),
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
          url: '/api/1/events/' + Apunto.config.calendarId,
          data: {
            userName: Apunto.config.userName,
            companyName: Apunto.config.companyName,
            start: event.start.toDate(),
            end: event.end.toDate(),
            name: event.title,
            email: event.email,
            number: event.number,
            message: message,
            templateId: templates[0]._id,
            reminderDate: moment(event.start).subtract(1, 'hours').toDate()
          }
        }).done(function () {
          calendar.fullCalendar( 'refetchEvents');
        });
      });
    };

    var adjustNumberOfDays = function () {

      var $reminderType = $('[name=reminder-type]');
      var $reminderUnit = $('[name=reminder-unit]');

      if ($reminderType.val() === 'days') {
        $reminderUnit.val(1);
      }
    };

    var hideContactDetails = function () {
      $('form.create-update').removeClass('contact-details--show');
    };

    var showContactNew = function (e) {
      e.preventDefault();
      $('form.create-update').removeClass('contact-details--show').addClass('contact-new--show');
    };

    var clearNewContactFields = function (e) {
      e.preventDefault();
      $('form.create-update').removeClass('contact-details--show').addClass('contact-new--show');

      var $form = $(this).parents('form');
      var $newContactFields = $form.find('.contact-new');
      
      // Clear fields
      $newContactFields.find('[name="name"]').val('');
      $newContactFields.find('[name="number"]').val('');
      $newContactFields.find('[name="email"]').val('');
    };

    $('body').on('click', '#create .create', createEvent);
    $('body').on('click', '#update .update', updateEvent);
    $('body').on('click', '.textarea-cover', enableTextarea);
    $('body').on('blur' , '.modal-message-preview textarea', disableTextarea);
    $('body').on('keyup', '.modal-message-preview textarea', previewMessage);
    $('body').on('change', '.modal-template-select', changeTemplate);
    $('body').on('click', '.template-list a', updateTemplateForm);
    $('body').on('click', '.template-add-new', showTemplateForm);
    $('body').on('change', '[name=reminder-type]', adjustNumberOfDays);
    $('body').on('click', '.contact-details .close', hideContactDetails);
    $('body').on('click', '.contact-details .change-contact', showContactNew);
    $('body').on('click', '.add-new-contact', clearNewContactFields);

    setInterval(function () {
      calendar.fullCalendar( 'refetchEvents');
    }, 60000);

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
        hiddenDays: [0,6],
        header: {
          left: '',
          center: 'title',
          right:  'today prev,next'
        },
        droppable: true,
        
        // methods
        eventRender: eventRender,
        select: showCreateModal,
        eventClick: eventClick,
        eventDrop: eventUpdate,
        eventResize: eventUpdate,
        viewRender: viewRender,
        eventReceive: eventReceive,
      });
    };
    createCalendar();
  });
})(window.jQuery, window.moment, window.ejs, window.i18next);