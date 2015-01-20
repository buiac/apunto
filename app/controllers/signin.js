module.exports = function(config, db) {
	var express = require('express');
  var expressSession = require('express-session');

  var expressValidator = require('express-validator');


  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var flash = require('connect-flash');
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;


  var view = function(req, res, next) {

    res.render('signin', {info: req.flash("message")});
    
  };


  return {
    view: view
  };

};