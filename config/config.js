/* config
 */

module.exports = (function() {
  'use strict';

  var fs = require('fs');

  // api configs
  var config = {

    // app folders
    dataDir: process.env.OPENSHIFT_DATA_DIR || process.cwd() + '/data',
    publicDir: '/public',
    dbDir: '/db',

    timezone: 'Europe/Bucharest',

    errors: {
    }
  };

  // read admin user credentials
  config.admin = JSON.parse(fs.readFileSync(config.dataDir + '/private/admin-config.json'));

  // read mailchimp api details
  config.mailchimp = JSON.parse(fs.readFileSync(config.dataDir + '/private/mailchimp-config.json'));

  // dev config
  if(process.env.OPENSHIFT_APP_NAME === 'dev') {

  }

  // live config
  if(process.env.OPENSHIFT_APP_NAME === 'live') {

  }

  //  ip and port
  config.ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
  config.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

  return config;

}());
