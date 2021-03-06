var http = require('http');
var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../models/user').User;

router.get('/', function(req, res, next) {
  res.render('auth', { message: req.flash('error') });
});

router.post('/', passport.authenticate('local-signup', {
  successRedirect: '/todo',
  failureRedirect: '/signup',
  failureFlash: true
  })
);

module.exports = router;