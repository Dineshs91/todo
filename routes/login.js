var express = require('express');
var router = express.Router();
var passport = require('passport');

var user = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('auth');
});

router.post('/', passport.authenticate('local-login', {
    successRedirect: '/todo',
    failureRedirect: '/login',
    failureFlash: true
  })
);

module.exports = router;
