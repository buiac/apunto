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
    modalContent.html('')

    modalContent.append(temp);

    modal.modal()

    $('.mobile-number').intlTelInput({
      defaultCountry: 'auto',
      utilsScript: '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js'
    });

  }

  function createContact (e) {
    e.preventDefault()

    var $form = $('#create-contact');
    var url = '/api/1/contacts/' + Apunto.config.calendarId

    var contact = {
      name: $form.find('[name="name"]').val(),
      title: $form.find('[name="name"]').val(),
      number: $form.find('[name="number"]').intlTelInput('getNumber'),
      calendarId: Apunto.config.calendarId
    };

    $.ajax({
      method: 'POST',
      url: url,
      data: contact
    }).done(function (res) {
      
      window.location.reload()
      
    })
  }

  $('body').on('click', '.btn-new-contact', showNewContactModal)
  $('body').on('click', '#create-contact .create', createContact)
});