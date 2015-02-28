#!/bin/env node
/* EHUD
 */

/* INSTRUCTIONS
 * run as
 * node ehud YOUR_GOOGLE_EMAIL YOUR_GOOGLE_PASSWORD
 */

require('native-promise-only');

module.exports = (function() {
  'use strict';  
  
  var express = require('express');
  var app = express();
  
  
  var params = {
    email: process.argv[2],
    password: process.argv[3]
  };
  
  if(!params.email) {
    throw Error('See ehud.js for details on how to run the script.');
  }
  
  var calendarUrl = 'https://apidata.googleusercontent.com/caldav/v2/' + encodeURIComponent(params.email) + '/events';
  
  /*
  var dav = require('dav');
  var xhr = new dav.transport.Basic(
    new dav.Credentials({
      username: params.email,
      password: params.password
    })
  );
  
  var client = new dav.Client(xhr);
  
  client.createAccount({
    server: calendarUrl
  }).then(function(res) {
    
    console.log(res);
    
  });
*/
  
  console.log(calendarUrl);
  
  var caldav = require('node-caldav');
  caldav.getEvents(calendarUrl,
    params.email,
    params.password,
    function(res) {
    
    console.log('res', res);
    
  })
  
  app.listen(function() {
    console.log(
      '%s: Node server started...',
      Date(Date.now())
    );
  });
  
  return app;
  

}());
