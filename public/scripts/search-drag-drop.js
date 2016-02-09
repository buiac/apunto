// qs_score - Quicksilver Score
// 
// A port of the Quicksilver string ranking algorithm
// 
// "hello world".score("axl") //=> 0.0
// "hello world".score("ow") //=> 0.6
// "hello world".score("hello world") //=> 1.0
//
// Tested in Firefox 2 and Safari 3
//
// The Quicksilver code is available here
// http://code.google.com/p/blacktree-alchemy/
// http://blacktree-alchemy.googlecode.com/svn/trunk/Crucible/Code/NSString+BLTRRanking.m
//
// The MIT License
// 
// Copyright (c) 2008 Lachie Cox
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


String.prototype.score = function(abbreviation,offset) {
  offset = offset || 0 // TODO: I think this is unused... remove
 
  if(abbreviation.length == 0) return 0.9
  if(abbreviation.length > this.length) return 0.0

  for (var i = abbreviation.length; i > 0; i--) {
    var sub_abbreviation = abbreviation.substring(0,i)
    var index = this.indexOf(sub_abbreviation)


    if(index < 0) continue;
    if(index + abbreviation.length > this.length + offset) continue;

    var next_string       = this.substring(index+sub_abbreviation.length)
    var next_abbreviation = null

    if(i >= abbreviation.length)
      next_abbreviation = ''
    else
      next_abbreviation = abbreviation.substring(i)
 
    var remaining_score   = next_string.score(next_abbreviation,offset+index)
 
    if (remaining_score > 0) {
      var score = this.length-next_string.length;

      if(index != 0) {
        var j = 0;

        var c = this.charCodeAt(index-1)
        if(c==32 || c == 9) {
          for(var j=(index-2); j >= 0; j--) {
            c = this.charCodeAt(j)
            score -= ((c == 32 || c == 9) ? 1 : 0.15)
          }

          // XXX maybe not port this heuristic
          // 
          //          } else if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:matchedRange.location]]) {
          //            for (j = matchedRange.location-1; j >= (int) searchRange.location; j--) {
          //              if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:j]])
          //                score--;
          //              else
          //                score -= 0.15;
          //            }
        } else {
          score -= index
        }
      }
   
      score += remaining_score * next_string.length
      score /= this.length;
      return score
    }
  }
  return 0.0
};

jQuery.fn.liveUpdate = function(list){

  list = jQuery(list);

  if ( list.length ) {
    var rows = list.children('li'),
      cache = rows.map(function(){
        return this.innerHTML.toLowerCase();
      });
     
    this
      .keyup(filter).keyup()
      .parents('form').submit(function(){
        return false;
      });
  }
   
  return this;
   
  function filter(){
    

    var term = jQuery.trim( jQuery(this).val().toLowerCase() ), scores = [];
   
    if ( !term ) {
      rows.show();
    } else {
      rows.hide();
 
      cache.each(function(i){
        var score = this.score(term);
        if (score > 0) { scores.push([score, i]); }
      });
 
      jQuery.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
        jQuery(rows[ this[1] ]).show();
      });
    }
  }
};

$(document).ready(function () {

  var contactsTemplate = '';
  var searchToggle = false;

  // Get templates
  $.ajax({
    method: 'GET',
    url: 'templates/contacts.ejs'
  }).done(function (res) {

    contactsTemplate = res;

    $('#srch-term').liveUpdate('.contacts-list-content ul');
    
  });

  var getContacts = function () {

    $.ajax({
      method: 'GET',
      url: 'api/1/contacts/' + $('.calendar').data('calendarid'),
    }).done(function (res) {

      // add calendar id to the response
      res.calendarId = $('.calendar').data('calendarid');

      var temp = ejs.render(contactsTemplate, res);
      $('.contacts-list-content').html(temp);

      $('#srch-term').liveUpdate('.contacts-list-content ul');

      $('.drag-item').draggable({
          revert: true,      // immediately snap back to original position
          revertDuration: 0  //
      });
      
    });

  };

  $('.show-clients').click(function (e) {
    e.preventDefault();
    
    searchToggle ? $('body').removeClass('search-active') : $('body').addClass('search-active');
    
    searchToggle = !searchToggle;
    
    getContacts();

  });

  getContacts()

  $('.contacts-list-header .close').on('click', function (e) {
    e.preventDefault();

    searchToggle = !searchToggle;

    $('body').removeClass('search-active');

  });

  $('body').on('click', '.btn-confirm', function (e) {
    e.preventDefault();

    var $deleteButton = $(this);
    var $contact = $deleteButton.parent();
    var $container = $contact.parent()

    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this information!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      closeOnConfirm: false 
    }, function (isConfirm) {
      
      if (isConfirm) {

        var url = e.target.parentNode.href;

        $.ajax({
          method: 'GET',
          url: url,
        }).done(function (res) {

          // remove item form list
          $contact.remove()

          if (!$container.children().length) {
            // append alert with message
            $container.parent().html('<div class="alert alert-info"><p>You have no contacts yet.</p></div>')
          }

          // show success modal
          swal("Deleted!", "The data has been deleted.", "success");

        });

      } else {

        swal("Cancelled", "Your data is safe", "error");

      }

    });

  })
  
});