'use strict';
(function ($, ejs) {
  $(document).ready(function () {

  var contactEditTemplate = null;
  var Apunto = {};

  Apunto.config = {
    calendarId: $('.calendar').data('calendarid'),
    userId: $('.contacts-list').data('userid'),
    userName: $('.calendar').data('username'),
    template: $('.calendar').data('template'),
    companyName: $('.calendar').data('companyname'),
    apiUrl: '',
    tzoffset: new Date().getTimezoneOffset(),
  };

  $.ajax({
    method: 'GET',
    url: '/templates/contact-edit.ejs'
  }).done(function (res) {

    contactEditTemplate = res;

  });

  function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
  
  function showNewContactModal (e) {
    e.preventDefault();

    var modal = $('#contact-modal');
    var modalContent = modal.find('.modal-content');

    var data = {
      modal: {
        title: 'Create a new contact',
        idName: 'create-contact'
      },
      contact: {
        title: '',
        number: ''
      }
    };


    var temp = ejs.render(contactEditTemplate, data);
    
    // clear html 
    modalContent.html('');
    modalContent.append(temp);
    modal.modal();

    $('.mobile-number').intlTelInput({
      defaultCountry: 'auto',
      utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
    });
  }

  var showEditContactModal = function (e) {
    e.preventDefault();

    var modal = $('#contact-modal');
    var modalContent = modal.find('.modal-content');

    var name = $(this).data('name');
    var number = $(this).data('number');
    var email = $(this).data('email');
    var contactId = $(this).data('id');

    var data = {
      modal: {
        title: 'Edit contact',
        idName: 'edit-contact'
      },
      contact: {
        title: name,
        number: number,
        email: (email !== 'undefined') ? email : '',
        contactId: contactId
      }
    };


    var temp = ejs.render(contactEditTemplate, data);
    
    // clear html 
    modalContent.html('');

    modalContent.append(temp);

    modal.modal();

    $('.mobile-number').intlTelInput({
      defaultCountry: 'auto',
      utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
    });
  };

  function updateContact (e) {
    e.preventDefault();
    
    var $form = $(e.target);
    var url = '/api/1/contacts/' + Apunto.config.calendarId;
    var $alert = $form.find('.alert');

    var contact = {
      name: $form.find('[name="name"]').val(),
      title: $form.find('[name="name"]').val(),
      number: $form.find('[name="number"]').intlTelInput('getNumber'),
      email: $form.find('[name="email"]').val(),
      calendarId: Apunto.config.calendarId
    };

    if ($form.find('[name="contactId"]').val()) {
      contact.contactId = $form.find('[name="contactId"]').val();
    }

    // check if the email is good
    if (contact.email && !validateEmail(contact.email)) {
      // add an error class to the form
      $form.addClass('errors');

      // update the error div message
      $alert.html('<p>The email address is incorect</p>');

      return;
    }

    $.ajax({
      method: 'POST',
      url: url,
      data: contact
    }).done(function () {
      window.location.reload();
    });
  }

  $('body').on('click', '.btn-new-contact', showNewContactModal);
  $('body').on('submit', '#create-contact', updateContact);
  $('body').on('click', '.edit-contact', showEditContactModal);
  $('body').on('submit', '#edit-contact', updateContact);
});
})(window.jQuery, window.ejs);