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

    serverTimezone: 'America/Detroit',

    admin: {
      user: 'admin',
      password: 'admin'
    },

    sender: 'Apunto',

    gateway: {
      key: '0',
      secret: '0',
      protocol: 'https',
      debug: true
    },

    errors: {
    }
  };

  var adminUserFile = config.dataDir + '/private/admin-config.json';

  if(fs.existsSync(adminUserFile)) {
    // read admin user credentials from file
    config.admin = JSON.parse(fs.readFileSync(adminUserFile));
  }

  var gatewayFile = config.dataDir + '/private/nexmo-config.json';

  if(fs.existsSync(gatewayFile)) {
    // read sms gateway details
    config.gateway = JSON.parse(fs.readFileSync(gatewayFile));
  }

  // dev config
  if(process.env.OPENSHIFT_APP_NAME === 'dev') {

  }

  // live config
  if(process.env.OPENSHIFT_APP_NAME === 'live') {

  }

  if(process.env.OPENSHIFT_APP_NAME) {
    process.env.TZ = config.serverTimezone;
  }

  //  ip and port
  config.ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
  config.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

  return config;

}());
