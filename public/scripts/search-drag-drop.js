'use strict';
(function ($, ejs, List, swal) {
  $(document).ready(function () {

    var contactsTemplate = '';
    var searchToggle = false;

    // Get templates
    $.ajax({
      method: 'GET',
      url: 'templates/contacts.ejs'
    }).done(function (res) {

      contactsTemplate = res;
      
    });

    var getContacts = function () {

      $.ajax({
        method: 'GET',
        url: 'api/1/contacts/' + $('.calendar').data('calendarid'),
      }).done(function (res) {

        // add calendar id to the response
        res.calendarId = $('.calendar').data('calendarid');

        // create contacts list
        var temp = ejs.render(contactsTemplate, res);
        $('.contacts-list-content').html(temp);

        // init search items
        var options = {
          valueNames: [ 'name']
        };

        new List('contacts', options);

        // init draggable
        $('.drag-item').draggable({
            revert: true,      // immediately snap back to original position
            revertDuration: 0  //
        });
        
      });

    };

    $('.show-clients').click(function (e) {
      e.preventDefault();
      
      if (searchToggle) {
        $('body').removeClass('search-active');
      } else {
        $('body').addClass('search-active');
      }
      
      searchToggle = !searchToggle;
      
      getContacts();

    });

    getContacts();

    $('.contacts-list-header .close').on('click', function (e) {
      e.preventDefault();

      searchToggle = !searchToggle;

      $('body').removeClass('search-active');
    });

    // delete contact
    $('body').on('click', '.btn-confirm', function (e) {
      e.preventDefault();
      var self = this;

      var $deleteButton = $(this);
      var $contact = $deleteButton.parent();

      swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover this information!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        closeOnConfirm: false 
      }, function (isConfirm) {
        
        if (isConfirm) {

          var url = self.href;

          $.ajax({
            method: 'GET',
            url: url,
          }).done(function () {

            // remove item form list
            $contact.remove();

            // show success modal
            swal('Deleted!', 'The data has been deleted.', 'success');

            getContacts();
          });

        } else {

          swal('Cancelled', 'Your data is safe', 'error');

        }
      });
    });
  });
})(window.jQuery, window.ejs, window.List, window.swal);