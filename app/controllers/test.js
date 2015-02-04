module.exports = function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var sugar = require('sugar');

  var moment = require('moment');


  var action = function (req,res , next) {
  	
  	console.log();

  	db.alerts.find({
  	  // date: {
  	  //   $gte: moment().subtract(2, 'minutes').toDate(),
  	  //   $lte: moment().toDate()
  	  // },
  	  sent: {
  	    $ne: true
  	  }
  	}).sort({
  	  date: -1
  	}).exec(function (err, alerts) {
  		console.log(alerts);
  	});

  	res.json([{'name':'fox'}]);

  };

  return {
  	action: action
  }
};